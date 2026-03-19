/**
 * 오답노트의 unitId를 unitDetail 기준으로 재매칭하고,
 * 각 단원의 에러 카운트를 재계산하는 스크립트.
 *
 * 사용: npx tsx src/scripts/fix-incorrect-note-units.ts
 */

import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import * as admin from "firebase-admin";

function trimEnv(value: string | undefined): string {
    return (value ?? "").trim();
}

if (!admin.apps.length) {
    const projectId = trimEnv(process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) || "nari-math-flow";
    const clientEmail = trimEnv(process.env.FIREBASE_CLIENT_EMAIL);
    const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;
    const privateKey = privateKeyRaw ? trimEnv(privateKeyRaw.replace(/\\n/g, "\n")) : undefined;

    if (projectId && clientEmail && privateKey) {
        admin.initializeApp({
            credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
        });
    }
}

const db = admin.apps.length > 0 ? admin.firestore() : null;

const VALID_ERROR_TYPES = ["C", "M", "R", "S"] as const;

async function fixIncorrectNoteUnits() {
    if (!db) {
        console.error("Firebase Admin 미연결. .env.local 설정을 확인하세요.");
        process.exit(1);
    }

    const studentsSnap = await db.collection("students").get();
    console.log(`학생 ${studentsSnap.size}명 조회됨\n`);

    let totalNotesFixed = 0;
    let totalUnitsRecalculated = 0;

    for (const studentDoc of studentsSnap.docs) {
        const studentRef = studentDoc.ref;
        const studentName = (studentDoc.data().name as string) || studentDoc.id;

        // 1. 단원 목록 로드
        const unitsSnap = await studentRef.collection("units").get();
        const units = unitsSnap.docs.map(d => ({ docId: d.id, ...d.data() })) as any[];

        if (units.length === 0) continue;

        // 2. 오답노트 목록 로드
        const notesSnap = await studentRef.collection("incorrectNotes").get();
        if (notesSnap.empty) continue;

        console.log(`[${studentName}] 단원 ${units.length}개, 오답노트 ${notesSnap.size}개`);

        // 3. 각 오답노트의 unitId 재매칭
        for (const noteDoc of notesSnap.docs) {
            const note = noteDoc.data();
            const oldUnitId = note.unitId as number | undefined;

            // unitDetail로 정확한 단원 찾기
            let correctUnit = units.find(u =>
                u.schoolLevel === note.schoolLevel &&
                u.grade === note.grade &&
                u.subject === note.subject &&
                (u.unitName || u.name) === note.unitName &&
                note.unitDetail &&
                Array.isArray(u.unitDetails) &&
                u.unitDetails.includes(note.unitDetail)
            );

            // unitDetail 매칭 실패 시 unitName만으로 fallback
            if (!correctUnit && !note.unitDetail) {
                correctUnit = units.find(u =>
                    u.schoolLevel === note.schoolLevel &&
                    u.grade === note.grade &&
                    u.subject === note.subject &&
                    (u.unitName || u.name) === note.unitName
                );
            }

            const correctUnitId = correctUnit ? correctUnit.id : 0;

            if (oldUnitId !== correctUnitId && correctUnitId !== 0) {
                await noteDoc.ref.update({ unitId: correctUnitId });
                totalNotesFixed++;
                const oldName = units.find(u => u.id === oldUnitId);
                console.log(`  오답노트 "${note.problemName || noteDoc.id}": unitId ${oldUnitId}(${oldName?.name || "?"}) → ${correctUnitId}(${correctUnit?.name || "?"})`);
            }
        }

        // 4. 모든 단원의 에러 카운트 재계산
        const updatedNotesSnap = await studentRef.collection("incorrectNotes").get();

        for (const unitData of units) {
            const unitId = unitData.id as number;
            const unitNotes = updatedNotesSnap.docs
                .map(d => d.data())
                .filter(n => n.unitId === unitId);

            const counts = { errorC: 0, errorM: 0, errorR: 0, errorS: 0 };
            for (const n of unitNotes) {
                const et = n.errorType as string;
                if (VALID_ERROR_TYPES.includes(et as any)) {
                    counts[`error${et}` as keyof typeof counts]++;
                }
            }

            // 단원 문서 찾기
            const unitDocSnap = await studentRef.collection("units").where("id", "==", unitId).limit(1).get();
            if (unitDocSnap.empty) continue;

            const unitDoc = unitDocSnap.docs[0];
            const currentData = unitDoc.data();
            const changed =
                currentData.errorC !== counts.errorC ||
                currentData.errorM !== counts.errorM ||
                currentData.errorR !== counts.errorR ||
                currentData.errorS !== counts.errorS;

            if (changed) {
                await unitDoc.ref.update(counts);
                totalUnitsRecalculated++;
                console.log(`  단원 "${unitData.name}" 에러 카운트 재계산: C=${counts.errorC} M=${counts.errorM} R=${counts.errorR} S=${counts.errorS}`);
            }
        }
    }

    console.log(`\n완료: 오답노트 ${totalNotesFixed}건 unitId 수정, 단원 ${totalUnitsRecalculated}건 에러 카운트 재계산`);
    process.exit(0);
}

fixIncorrectNoteUnits().catch((err) => {
    console.error("스크립트 실행 오류:", err);
    process.exit(1);
});
