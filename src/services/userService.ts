import { adminDb } from "@/lib/firebase-admin";
import type { FirestoreUser } from "@/types/firestore-user";

const USERS_COLLECTION = "users";

export const userService = {
    /**
     * uid로 users 문서 조회 (소셜 provider sub = uid)
     */
    async getUser(uid: string): Promise<(FirestoreUser & { status?: string }) | null> {
        try {
            const doc = await adminDb.collection(USERS_COLLECTION).doc(uid).get();
            if (!doc.exists) return null;
            return doc.data() as FirestoreUser & { status?: string };
        } catch (err) {
            console.error("[userService.getUser]", err);
            return null;
        }
    },

    /**
     * username으로 조회 (학부모 아이디/비밀번호 로그인용)
     */
    async getUserByUsername(username: string): Promise<(FirestoreUser & { passwordHash?: string }) | null> {
        try {
            const snapshot = await adminDb
                .collection(USERS_COLLECTION)
                .where("username", "==", username)
                .limit(1)
                .get();
            if (snapshot.empty) return null;
            return snapshot.docs[0].data() as FirestoreUser & { passwordHash?: string };
        } catch (err) {
            console.error("[userService.getUserByUsername]", err);
            return null;
        }
    },

    /**
     * email로 기존 유저 존재 여부 (중복 가입 방지)
     */
    async getUserByEmail(email: string): Promise<FirestoreUser | null> {
        try {
            const snapshot = await adminDb
                .collection(USERS_COLLECTION)
                .where("email", "==", email)
                .limit(1)
                .get();
            if (snapshot.empty) return null;
            return snapshot.docs[0].data() as FirestoreUser;
        } catch (err) {
            console.error("[userService.getUserByEmail]", err);
            return null;
        }
    },
};
