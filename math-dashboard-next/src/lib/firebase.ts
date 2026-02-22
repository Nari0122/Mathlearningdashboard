import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

/**
 * Firebase 클라이언트 설정.
 * Vercel 등에서는 Environment Variables에 NEXT_PUBLIC_FIREBASE_* 를 설정하세요.
 * storageBucket이 없으면 projectId 기반 기본 버킷(projectId.appspot.com)을 사용합니다.
 */
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const storageBucket =
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim() ||
    (projectId ? `${projectId}.appspot.com` : undefined);

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId,
    storageBucket,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Storage는 storageBucket이 있을 때만 초기화합니다.
 * 버킷이 없으면 getStorage()가 "No default bucket found" 오류를 냅니다.
 */
let storage: FirebaseStorage | null = null;
if (storageBucket) {
    storage = getStorage(app);
}

export { db, app, storage };
