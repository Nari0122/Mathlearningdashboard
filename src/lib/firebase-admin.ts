import * as admin from "firebase-admin";

if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "nari-math-flow",
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
            }),
        });
    } catch (error) {
        console.error("Firebase admin initialization error", error);
    }
}

/** 초기화 성공 시에만 Firestore 인스턴스. 실패 시 null (서버 예외 방지) */
export const adminDb: admin.firestore.Firestore | null = admin.apps.length > 0 ? admin.firestore() : null;
export { admin };
