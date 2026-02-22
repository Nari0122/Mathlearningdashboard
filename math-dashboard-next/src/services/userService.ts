import * as bcrypt from "bcryptjs";
import { adminDb } from "@/lib/firebase-admin";
import type { FirestoreUser, FirestoreUserAdmin } from "@/types/firestore-user";

/** Firestore 관리자 컬렉션. 문서 ID = 카카오 uid. */
const ADMINS_COLLECTION = "admins";

/** Credentials 로그인 성공 시 반환용 (세션에 넣을 값) */
export type AdminSessionUser = {
    uid: string;
    name: string;
    role: "SUPER_ADMIN" | "ADMIN";
    status: string;
};

export const userService = {
    /**
     * uid(카카오 uid)로 admins 문서 조회. 관리자 여부 확인용.
     */
    async getAdmin(uid: string): Promise<(FirestoreUserAdmin & { status?: string }) | null> {
        if (!adminDb) return null;
        try {
            const doc = await adminDb.collection(ADMINS_COLLECTION).doc(uid).get();
            if (!doc.exists) return null;
            return doc.data() as FirestoreUserAdmin & { status?: string };
        } catch (err) {
            console.error("[userService.getAdmin]", err);
            return null;
        }
    },

    /**
     * username으로 admins 조회 (아이디·비밀번호 로그인용)
     */
    async getAdminByUsername(username: string): Promise<(FirestoreUserAdmin & { passwordHash?: string }) | null> {
        if (!adminDb) return null;
        try {
            const snapshot = await adminDb
                .collection(ADMINS_COLLECTION)
                .where("username", "==", username)
                .limit(1)
                .get();
            if (snapshot.empty) return null;
            return snapshot.docs[0].data() as FirestoreUserAdmin & { passwordHash?: string };
        } catch (err) {
            console.error("[userService.getAdminByUsername]", err);
            return null;
        }
    },

    /**
     * 관리자 아이디·비밀번호 검증 (Credentials 로그인용). admins 컬렉션 조회.
     */
    async verifyAdminCredentials(
        username: string,
        password: string
    ): Promise<AdminSessionUser | null> {
        if (!adminDb) return null;
        try {
            const snapshot = await adminDb
                .collection(ADMINS_COLLECTION)
                .where("username", "==", username)
                .limit(1)
                .get();
            if (snapshot.empty) return null;
            const doc = snapshot.docs[0];
            const data = doc.data() as FirestoreUserAdmin & { passwordHash?: string };
            if (data.role !== "SUPER_ADMIN" && data.role !== "ADMIN") return null;
            const hash = data.passwordHash;
            if (!hash) return null;
            const ok = await bcrypt.compare(password, hash);
            if (!ok) return null;
            return {
                uid: doc.id,
                name: data.name,
                role: data.role,
                status: data.status ?? "PENDING",
            };
        } catch (err) {
            console.error("[userService.verifyAdminCredentials]", err);
            return null;
        }
    },

    /**
     * 관리자 목록 조회 (Super Admin 전용). admins 컬렉션.
     */
    async listAdmins(): Promise<Array<FirestoreUserAdmin & { uid: string }>> {
        if (!adminDb) return [];
        try {
            const snapshot = await adminDb
                .collection(ADMINS_COLLECTION)
                .get();
            return snapshot.docs
                .map((d) => ({ ...(d.data() as FirestoreUserAdmin), uid: d.id }))
                .filter((a) => a.role === "SUPER_ADMIN" || a.role === "ADMIN");
        } catch (err) {
            console.error("[userService.listAdmins]", err);
            return [];
        }
    },

    /**
     * 관리자 승인 상태 변경 (Super Admin 전용). admins 컬렉션.
     */
    async updateAdminStatus(
        uid: string,
        status: "PENDING" | "APPROVED"
    ): Promise<{ success: boolean; message?: string }> {
        if (!adminDb) return { success: false, message: "Database not available" };
        try {
            const ref = adminDb.collection(ADMINS_COLLECTION).doc(uid);
            const doc = await ref.get();
            if (!doc.exists) return { success: false, message: "관리자를 찾을 수 없습니다." };
            const data = doc.data();
            if (data?.role !== "ADMIN" && data?.role !== "SUPER_ADMIN") return { success: false, message: "관리자 계정이 아닙니다." };
            if (data?.role === "SUPER_ADMIN") return { success: false, message: "Super Admin 상태는 변경할 수 없습니다." };
            await ref.update({ status });
            return { success: true };
        } catch (err) {
            console.error("[userService.updateAdminStatus]", err);
            return { success: false, message: "처리 중 오류가 발생했습니다." };
        }
    },

    /**
     * 관리자 계정 삭제 (Super Admin 전용). SUPER_ADMIN은 삭제 불가.
     */
    async deleteAdmin(uid: string): Promise<{ success: boolean; message?: string }> {
        if (!adminDb) return { success: false, message: "Database not available" };
        try {
            const ref = adminDb.collection(ADMINS_COLLECTION).doc(uid);
            const doc = await ref.get();
            if (!doc.exists) return { success: false, message: "관리자를 찾을 수 없습니다." };
            const data = doc.data();
            if (data?.role === "SUPER_ADMIN") return { success: false, message: "Super Admin 계정은 삭제할 수 없습니다." };
            await ref.delete();
            return { success: true };
        } catch (err) {
            console.error("[userService.deleteAdmin]", err);
            return { success: false, message: "삭제 중 오류가 발생했습니다." };
        }
    },

    /**
     * 관리자 가입 (비공개 URL /admin-login 전용). admins 컬렉션에 role=ADMIN, status=PENDING.
     */
    async createAdmin(data: {
        username: string;
        password: string;
        name: string;
        phoneNumber: string;
    }): Promise<{ success: boolean; message?: string; uid?: string }> {
        if (!adminDb) return { success: false, message: "Database not available" };
        try {
            const existing = await this.getAdminByUsername(data.username);
            if (existing) return { success: false, message: "이미 사용 중인 아이디입니다." };
            const passwordHash = await bcrypt.hash(data.password, 10);
            const uid = `admin_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
            await adminDb.collection(ADMINS_COLLECTION).doc(uid).set({
                uid,
                username: data.username,
                name: data.name,
                phoneNumber: data.phoneNumber,
                role: "ADMIN",
                status: "PENDING",
                passwordHash,
                createdAt: new Date().toISOString(),
            });
            return { success: true, uid };
        } catch (err) {
            console.error("[userService.createAdmin]", err);
            return { success: false, message: "가입 처리 중 오류가 발생했습니다." };
        }
    },

    /**
     * 카카오 로그인 후 관리자 계정 신청: uid(카카오 sub)를 문서 ID로 Firestore admins 컬렉션에 생성. role=ADMIN, status=PENDING.
     * Firebase 콘솔 → Firestore Database → admins 컬렉션에서 확인.
     */
    async createAdminWithKakao(uid: string, name: string, phoneNumber: string): Promise<{ success: boolean; message?: string }> {
        if (!uid || typeof uid !== "string" || !uid.trim()) {
            console.error("[userService.createAdminWithKakao] uid 비어 있음");
            return { success: false, message: "로그인 정보가 없습니다. 다시 카카오 로그인 후 시도해 주세요." };
        }
        if (!adminDb) {
            console.error("[userService.createAdminWithKakao] Firebase Admin 미연결. .env.local에 FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY 설정 여부 확인.");
            return { success: false, message: "Firebase에 연결되지 않았습니다. FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY를 .env.local에 설정해 주세요." };
        }
        try {
            const existing = await this.getAdmin(uid);
            if (existing) {
                const r = (existing as { role?: string }).role;
                if (r === "ADMIN" || r === "SUPER_ADMIN") return { success: false, message: "이미 관리자로 등록된 계정입니다." };
            }
            await adminDb.collection(ADMINS_COLLECTION).doc(uid).set({
                uid,
                name: name.trim(),
                phoneNumber: phoneNumber.trim(),
                role: "ADMIN",
                status: "PENDING",
                createdAt: new Date().toISOString(),
            });
            return { success: true };
        } catch (err) {
            console.error("[userService.createAdminWithKakao]", err);
            return { success: false, message: "Firestore 저장 중 오류가 발생했습니다. Firebase 콘솔에서 권한과 admins 컬렉션을 확인해 주세요." };
        }
    },

    /**
     * email로 admins에서 존재 여부 (중복 가입 방지)
     */
    async getAdminByEmail(email: string): Promise<FirestoreUserAdmin | null> {
        if (!adminDb) return null;
        try {
            const snapshot = await adminDb
                .collection(ADMINS_COLLECTION)
                .where("email", "==", email)
                .limit(1)
                .get();
            if (snapshot.empty) return null;
            return snapshot.docs[0].data() as FirestoreUserAdmin;
        } catch (err) {
            console.error("[userService.getAdminByEmail]", err);
            return null;
        }
    },
};
