/**
 * 제출 상태(status) 재판정 (일회성 마이그레이션)
 *
 * submittedDate가 수정된 후, 실제 제출 시각과 마감 시각을 비교하여
 * submitted / late-submitted 상태를 다시 판정한다.
 *
 * 사용: npx tsx src/scripts/fix-submission-status.ts
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

function getDeadline(assignment: { submissionDeadline?: string; dueDate?: string }): Date {
    if (assignment.submissionDeadline) {
        return new Date(assignment.submissionDeadline);
    }
    const due = assignment.dueDate || "";
    return new Date(`${due}T23:59:59+09:00`);
}

async function fixSubmissionStatuses() {
    if (!db) {
        console.error("Firebase Admin 미연결. .env.local 설정을 확인하세요.");
        process.exit(1);
    }

    let totalFixed = 0;
    const studentsSnap = await db.collection("students").get();
    console.log(`학생 ${studentsSnap.size}명 조회됨\n`);

    for (const studentDoc of studentsSnap.docs) {
        const assignmentsSnap = await studentDoc.ref.collection("assignments").get();

        for (const assignmentDoc of assignmentsSnap.docs) {
            const data = assignmentDoc.data();
            const currentStatus = data.status as string;
            const submittedDate = data.submittedDate as string | undefined;

            if (!submittedDate || (currentStatus !== "submitted" && currentStatus !== "late-submitted")) {
                continue;
            }

            const submittedAt = new Date(submittedDate);
            const deadline = getDeadline(data as any);
            const dueDate = (data.dueDate as string) || "";
            const submittedDateStr = submittedAt.toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });

            const isLate = submittedDateStr > dueDate || submittedAt >= deadline;
            const correctStatus = isLate ? "late-submitted" : "submitted";

            if (currentStatus !== correctStatus) {
                await assignmentDoc.ref.update({ status: correctStatus });
                totalFixed++;
                const label = correctStatus === "submitted" ? "제출 완료" : "지각 제출";
                console.log(`  [${studentDoc.id}] "${data.title}": ${currentStatus} → ${correctStatus} (${label})`);
                console.log(`    제출: ${submittedDate} | 마감: ${data.submissionDeadline || dueDate + " 23:59:59"}`);
            }
        }
    }

    if (totalFixed === 0) {
        console.log("변경이 필요한 항목이 없습니다.");
    } else {
        console.log(`\n완료: ${totalFixed}건의 status 수정됨`);
    }
    process.exit(0);
}

fixSubmissionStatuses().catch((err) => {
    console.error("스크립트 실행 오류:", err);
    process.exit(1);
});
