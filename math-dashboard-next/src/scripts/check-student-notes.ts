/**
 * 특정 학생의 Firestore 문서 존재 여부 및 incorrectNotes 하위 컬렉션 확인
 *
 * 사용: npx tsx src/scripts/check-student-notes.ts
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

const db = admin.firestore();

async function checkStudent(uid: string) {
    console.log(`\n=== 학생 문서 확인: ${uid} ===\n`);

    const studentRef = db.collection("students").doc(uid);
    const studentDoc = await studentRef.get();

    if (!studentDoc.exists) {
        console.log("❌ students/" + uid + " 문서가 존재하지 않습니다!");
        return;
    }

    const data = studentDoc.data()!;
    console.log("✅ students/" + uid + " 문서 존재");
    console.log("   이름:", data.name);
    console.log("   학년:", data.grade);
    console.log("   학교:", data.schoolName);
    console.log("   승인상태:", data.approvalStatus);
    console.log("   계정상태:", data.accountStatus);
    console.log("   생성일:", data.createdAt);

    // 하위 컬렉션 확인
    const subcollections = await studentRef.listCollections();
    console.log("\n📁 하위 컬렉션 목록:");
    if (subcollections.length === 0) {
        console.log("   (하위 컬렉션 없음)");
    } else {
        for (const col of subcollections) {
            const snap = await col.limit(5).get();
            console.log(`   - ${col.id}: ${snap.size}개 문서`);
        }
    }

    // incorrectNotes 확인
    const notesSnap = await studentRef.collection("incorrectNotes").get();
    console.log(`\n📝 incorrectNotes: ${notesSnap.size}개`);
    if (notesSnap.size > 0) {
        notesSnap.docs.forEach((doc, i) => {
            const d = doc.data();
            console.log(`   [${i + 1}] ${doc.id} - ${d.problemName || "(이름없음)"} | ${d.errorType} | ${d.createdAt}`);
        });
    }

    // units 확인
    const unitsSnap = await studentRef.collection("units").get();
    console.log(`\n📚 units: ${unitsSnap.size}개`);
    if (unitsSnap.size > 0) {
        unitsSnap.docs.forEach((doc, i) => {
            const d = doc.data();
            console.log(`   [${i + 1}] id=${d.id} ${d.unitName || d.name || "(이름없음)"} | ${d.grade} ${d.subject}`);
        });
    }
}

checkStudent("4806799551").then(() => {
    console.log("\n완료.");
    process.exit(0);
}).catch((err) => {
    console.error("오류:", err);
    process.exit(1);
});
