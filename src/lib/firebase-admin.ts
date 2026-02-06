import * as admin from "firebase-admin";

if (!admin.apps.length) {
    try {
        console.log("DEBUG: Initializing Firebase Admin");

        // Debugging: List all keys starting with FIREBASE (to catch typos like ' FIREBASE_PROJECT_ID')
        const firebaseKeys = Object.keys(process.env).filter(key => key.includes('FIREBASE'));
        console.log("DEBUG: Available FIREBASE keys:", JSON.stringify(firebaseKeys));

        console.log("DEBUG: FIREBASE_PROJECT_ID exists:", !!process.env.FIREBASE_PROJECT_ID);
        console.log("DEBUG: FIREBASE_CLIENT_EMAIL exists:", !!process.env.FIREBASE_CLIENT_EMAIL);
        console.log("DEBUG: FIREBASE_PRIVATE_KEY exists:", !!process.env.FIREBASE_PRIVATE_KEY);

        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
            }),
        });
    } catch (error) {
        console.error("Firebase admin initialization error", error);
    }
}

export const adminDb = admin.firestore();
export { admin };
