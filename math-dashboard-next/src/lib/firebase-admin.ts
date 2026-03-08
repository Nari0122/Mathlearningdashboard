import * as admin from "firebase-admin";

/** Vercel 등에서 복사 시 앞뒤 줄바꿈·공백 제거 (illegal characters 오류 방지) */
function trimEnv(value: string | undefined): string {
    return (value ?? "").trim();
}

if (!admin.apps.length) {
    try {
        const projectId = trimEnv(process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) || "nari-math-flow";
        const clientEmail = trimEnv(process.env.FIREBASE_CLIENT_EMAIL);
        const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;
        const privateKey = privateKeyRaw ? trimEnv(privateKeyRaw.replace(/\\n/g, "\n")) : undefined;
        const storageBucket = trimEnv(process.env.FIREBASE_STORAGE_BUCKET) || trimEnv(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET) || `${projectId}.firebasestorage.app`;

        if (projectId && clientEmail && privateKey) {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId,
                    clientEmail,
                    privateKey,
                }),
                storageBucket,
            });
        }
    } catch (error) {
        console.error("Firebase admin initialization error", error);
    }
}

/** 초기화 성공 시에만 Firestore 인스턴스. 실패 시 null (서버 예외 방지) */
export const adminDb: admin.firestore.Firestore | null = admin.apps.length > 0 ? admin.firestore() : null;

let _bucket: ReturnType<ReturnType<typeof admin.storage>["bucket"]> | null | undefined;
export function getAdminBucket() {
    if (_bucket !== undefined) return _bucket;
    if (!admin.apps.length) { _bucket = null; return null; }
    try {
        _bucket = admin.storage().bucket();
        return _bucket;
    } catch {
        _bucket = null;
        return null;
    }
}

export { admin };
