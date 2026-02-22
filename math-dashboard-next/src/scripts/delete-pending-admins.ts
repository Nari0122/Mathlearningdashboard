/**
 * Firestore admins 컬렉션에서 role=ADMIN, status=PENDING 인 문서 삭제.
 * 승인 대기 중인 관리자를 지우고 다시 가입할 때 사용.
 *
 * 사용: npx tsx src/scripts/delete-pending-admins.ts
 * (또는 npm run script:delete-pending-admins)
 */

import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import { adminDb } from "../lib/firebase-admin";

const ADMINS_COLLECTION = "admins";

async function deletePendingAdmins() {
    if (!adminDb) {
        console.error("❌ Firebase Admin 미연결. .env.local 에 FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY 설정 후 다시 실행하세요.");
        process.exit(1);
    }

    try {
        const snapshot = await adminDb
            .collection(ADMINS_COLLECTION)
            .where("role", "==", "ADMIN")
            .where("status", "==", "PENDING")
            .get();

        if (snapshot.empty) {
            console.log("✅ 삭제할 대기 중인 관리자(ADMIN+PENDING)가 없습니다.");
            process.exit(0);
        }

        console.log(`📋 대기 중인 관리자 ${snapshot.size}건 삭제합니다.`);
        for (const doc of snapshot.docs) {
            const data = doc.data();
            console.log(`   - uid: ${doc.id}, name: ${data.name ?? "-"}, phone: ${data.phoneNumber ?? "-"}`);
            await doc.ref.delete();
        }
        console.log("✅ 삭제 완료. 해당 카카오 계정으로 /admin-login 에서 다시 회원가입할 수 있습니다.");
    } catch (err) {
        console.error("❌ 오류:", err);
        process.exit(1);
    }
    process.exit(0);
}

deletePendingAdmins();
