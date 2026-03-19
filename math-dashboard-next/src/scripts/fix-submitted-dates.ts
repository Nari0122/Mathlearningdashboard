/**
 * 기존 submittedDate 데이터 수정 (일회성 마이그레이션)
 *
 * 이전 코드 버그: KST 시간을 UTC 표시자("Z")와 함께 저장함.
 * 예) 18:09 KST → "2026-03-18T18:09:08.000Z" (실제로는 UTC 09:09)
 *
 * 수정: "Z"를 "+09:00"으로 교체하여 올바른 KST ISO 문자열로 변환.
 *
 * 사용: npx tsx src/scripts/fix-submitted-dates.ts
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

async function fixSubmittedDates() {
    if (!db) {
        console.error("Firebase Admin 미연결. .env.local 설정을 확인하세요.");
        process.exit(1);
    }

    let totalFixed = 0;
    const studentsSnap = await db.collection("students").get();
    console.log(`학생 ${studentsSnap.size}명 조회됨`);

    for (const studentDoc of studentsSnap.docs) {
        const assignmentsSnap = await studentDoc.ref.collection("assignments").get();

        for (const assignmentDoc of assignmentsSnap.docs) {
            const data = assignmentDoc.data();
            const sd = data.submittedDate as string | undefined;

            if (sd && typeof sd === "string" && sd.endsWith("Z")) {
                const fixed = sd.replace("Z", "+09:00");
                await assignmentDoc.ref.update({ submittedDate: fixed });
                totalFixed++;
                console.log(`  [${studentDoc.id}] ${assignmentDoc.id}: ${sd} → ${fixed}`);
            }
        }
    }

    console.log(`\n완료: ${totalFixed}건의 submittedDate 수정됨`);
    process.exit(0);
}

fixSubmittedDates().catch((err) => {
    console.error("스크립트 실행 오류:", err);
    process.exit(1);
});
