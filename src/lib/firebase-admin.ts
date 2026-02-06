import * as admin from "firebase-admin";

if (!admin.apps.length) {
    try {
        console.log("DEBUG: Initializing Firebase Admin");

        // Debugging: Find any key that looks like project_id to catch typos
        console.log("DEBUG: Keys containing PROJECT_ID:", JSON.stringify(Object.keys(process.env).filter(key => key.includes('PROJECT_ID'))));
        console.log("DEBUG: Keys containing FIREBASE:", JSON.stringify(Object.keys(process.env).filter(key => key.includes('FIREBASE'))));

        console.log("DEBUG: FIREBASE_PROJECT_ID exists:", !!process.env.FIREBASE_PROJECT_ID);

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
