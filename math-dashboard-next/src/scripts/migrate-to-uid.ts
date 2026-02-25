/**
 * 마이그레이션 스크립트: 숫자 ID 기반 학생 문서를 카카오 UID 기반으로 변환
 *
 * 실행 방법:
 *   npx tsx src/scripts/migrate-to-uid.ts
 *
 * 환경 변수 필요:
 *   FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
 *   FIREBASE_STORAGE_BUCKET (예: nari-math-flow.appspot.com)
 *
 * 이 스크립트가 수행하는 작업:
 * 1. Firestore students 컬렉션의 모든 문서를 스캔
 * 2. 문서 ID가 카카오 UID가 아닌(숫자인) 문서를 찾음
 * 3. 해당 문서에 kakaoUid 필드가 있으면 그 값으로, 없으면 건너뜀
 * 4. 새 문서 ID(카카오 UID)로 데이터를 복사 (id 필드 제외)
 * 5. 서브컬렉션도 모두 복사
 * 6. Storage의 파일을 새 경로로 복사
 * 7. Firestore의 storagePath 필드들을 업데이트
 * 8. parents 컬렉션의 studentIds 배열에서 숫자 ID → docId 로 교체
 * 9. 기존 문서/파일 삭제
 *
 * --dry-run 플래그로 실행하면 실제 변경 없이 대상만 출력합니다.
 */

import * as admin from "firebase-admin";

const DRY_RUN = process.argv.includes("--dry-run");

function trimEnv(value: string | undefined): string {
    return (value ?? "").trim();
}

const projectId = trimEnv(process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
const clientEmail = trimEnv(process.env.FIREBASE_CLIENT_EMAIL);
const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;
const privateKey = privateKeyRaw ? trimEnv(privateKeyRaw.replace(/\\n/g, "\n")) : undefined;
const storageBucket = trimEnv(process.env.FIREBASE_STORAGE_BUCKET);

if (!projectId || !clientEmail || !privateKey) {
    console.error("환경 변수가 설정되지 않았습니다: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY");
    process.exit(1);
}

admin.initializeApp({
    credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
    storageBucket: storageBucket || `${projectId}.appspot.com`,
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

const SUB_COLLECTIONS = [
    "units", "assignments", "incorrectNotes", "learningRecords",
    "schedules", "exams", "bookTags", "loginLogs",
];

async function copySubCollections(
    srcRef: admin.firestore.DocumentReference,
    destRef: admin.firestore.DocumentReference
) {
    for (const sub of SUB_COLLECTIONS) {
        const snap = await srcRef.collection(sub).get();
        if (snap.empty) continue;
        console.log(`    서브컬렉션 ${sub}: ${snap.size}개 문서 복사`);
        if (DRY_RUN) continue;
        for (const doc of snap.docs) {
            await destRef.collection(sub).doc(doc.id).set(doc.data());
        }
    }
}

async function moveStorageFiles(oldPrefix: string, newPrefix: string) {
    try {
        const [files] = await bucket.getFiles({ prefix: oldPrefix });
        if (files.length === 0) {
            console.log(`    Storage 파일 없음: ${oldPrefix}`);
            return;
        }
        console.log(`    Storage 파일 ${files.length}개 이동: ${oldPrefix} → ${newPrefix}`);
        if (DRY_RUN) return;
        for (const file of files) {
            const newPath = file.name.replace(oldPrefix, newPrefix);
            await file.copy(bucket.file(newPath));
            await file.delete();
        }
    } catch (error) {
        console.error(`    Storage 이동 중 오류:`, error);
    }
}

async function updateStoragePathsInSubCollections(
    docRef: admin.firestore.DocumentReference,
    oldDocId: string,
    newDocId: string
) {
    for (const sub of SUB_COLLECTIONS) {
        const snap = await docRef.collection(sub).get();
        for (const doc of snap.docs) {
            const data = doc.data();
            let needsUpdate = false;
            const updates: Record<string, any> = {};

            for (const [key, value] of Object.entries(data)) {
                if (typeof value === "string" && value.includes(`students/${oldDocId}/`)) {
                    updates[key] = value.replace(`students/${oldDocId}/`, `students/${newDocId}/`);
                    needsUpdate = true;
                }
                if (Array.isArray(value)) {
                    const newArr = value.map((item: any) => {
                        if (typeof item === "string" && item.includes(`students/${oldDocId}/`)) {
                            needsUpdate = true;
                            return item.replace(`students/${oldDocId}/`, `students/${newDocId}/`);
                        }
                        if (typeof item === "object" && item !== null) {
                            const newItem = { ...item };
                            for (const [k, v] of Object.entries(item)) {
                                if (typeof v === "string" && v.includes(`students/${oldDocId}/`)) {
                                    newItem[k] = (v as string).replace(`students/${oldDocId}/`, `students/${newDocId}/`);
                                    needsUpdate = true;
                                }
                            }
                            return newItem;
                        }
                        return item;
                    });
                    if (needsUpdate) updates[key] = newArr;
                }
            }

            if (needsUpdate && !DRY_RUN) {
                await doc.ref.update(updates);
            }
        }
    }
}

async function updateParentStudentIds(oldDocId: string, newDocId: string) {
    const parentsSnap = await db.collection("parents")
        .where("studentIds", "array-contains", oldDocId)
        .get();

    if (parentsSnap.empty) {
        const numId = parseInt(oldDocId, 10);
        if (!isNaN(numId)) {
            const numSnap = await db.collection("parents")
                .where("studentIds", "array-contains", numId)
                .get();
            for (const parentDoc of numSnap.docs) {
                console.log(`    학부모 ${parentDoc.id}: studentIds 숫자 ${numId} → ${newDocId}`);
                if (!DRY_RUN) {
                    await parentDoc.ref.update({
                        studentIds: admin.firestore.FieldValue.arrayRemove(numId),
                    });
                    await parentDoc.ref.update({
                        studentIds: admin.firestore.FieldValue.arrayUnion(newDocId),
                    });
                }
            }
        }
        return;
    }

    for (const parentDoc of parentsSnap.docs) {
        console.log(`    학부모 ${parentDoc.id}: studentIds ${oldDocId} → ${newDocId}`);
        if (!DRY_RUN) {
            await parentDoc.ref.update({
                studentIds: admin.firestore.FieldValue.arrayRemove(oldDocId),
            });
            await parentDoc.ref.update({
                studentIds: admin.firestore.FieldValue.arrayUnion(newDocId),
            });
        }
    }
}

async function main() {
    console.log(`\n=== 학생 데이터 마이그레이션 (숫자 ID → 카카오 UID) ===`);
    console.log(`모드: ${DRY_RUN ? "DRY RUN (실제 변경 없음)" : "실행"}\n`);

    const studentsSnap = await db.collection("students").get();
    console.log(`전체 학생 문서: ${studentsSnap.size}개\n`);

    let migrated = 0;
    let skipped = 0;
    let alreadyUid = 0;

    for (const doc of studentsSnap.docs) {
        const data = doc.data();
        const currentDocId = doc.id;

        if (!/^\d+$/.test(currentDocId)) {
            alreadyUid++;
            let needsUpdate = false;
            const updates: Record<string, any> = {};

            if (data.id !== undefined) {
                needsUpdate = true;
            }
            if (!data.createdAt) {
                updates.createdAt = new Date().toISOString();
                needsUpdate = true;
            }

            if (needsUpdate && !DRY_RUN) {
                if (data.id !== undefined) {
                    const { id: _, ...rest } = data;
                    await doc.ref.set({ ...rest, ...updates });
                    console.log(`[${currentDocId}] id 필드 제거 + createdAt 보충 완료`);
                } else {
                    await doc.ref.update(updates);
                    console.log(`[${currentDocId}] createdAt 보충 완료`);
                }
            }
            continue;
        }

        const uid = data.kakaoUid || data.uid;
        if (!uid) {
            console.log(`[${currentDocId}] 건너뜀 - kakaoUid/uid 필드 없음 (이름: ${data.name})`);
            skipped++;
            continue;
        }

        console.log(`[${currentDocId}] → [${uid}] 마이그레이션 (이름: ${data.name})`);

        const existingNew = await db.collection("students").doc(uid).get();
        if (existingNew.exists) {
            console.log(`  경고: 대상 문서 ${uid}가 이미 존재합니다. 건너뜀.`);
            skipped++;
            continue;
        }

        const { id: _numericId, ...cleanData } = data;

        if (!cleanData.createdAt) {
            cleanData.createdAt = new Date().toISOString();
            console.log(`    createdAt 필드 누락 → 현재 시각으로 보충`);
        }

        if (!DRY_RUN) {
            const newRef = db.collection("students").doc(uid);
            await newRef.set(cleanData);
        }

        await copySubCollections(doc.ref, db.collection("students").doc(uid));

        await moveStorageFiles(`students/${currentDocId}/`, `students/${uid}/`);

        await updateStoragePathsInSubCollections(
            db.collection("students").doc(uid),
            currentDocId,
            uid
        );

        await updateParentStudentIds(currentDocId, uid);

        if (!DRY_RUN) {
            for (const sub of SUB_COLLECTIONS) {
                const subSnap = await doc.ref.collection(sub).get();
                for (const subDoc of subSnap.docs) {
                    await subDoc.ref.delete();
                }
            }
            await doc.ref.delete();
        }

        migrated++;
        console.log(`  완료\n`);
    }

    // 기존 UID 기반 문서의 id 필드도 정리
    console.log(`\n=== 결과 ===`);
    console.log(`마이그레이션 완료: ${migrated}개`);
    console.log(`이미 UID 기반: ${alreadyUid}개`);
    console.log(`건너뜀: ${skipped}개`);
    console.log(`총: ${studentsSnap.size}개\n`);

    if (DRY_RUN) {
        console.log("DRY RUN이었습니다. 실제로 실행하려면 --dry-run 플래그를 제거하세요.");
    }

    process.exit(0);
}

main().catch((error) => {
    console.error("마이그레이션 실패:", error);
    process.exit(1);
});
