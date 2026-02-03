"use server";

import { adminDb, admin } from "@/lib/firebase-admin";

export async function loginAction(id: string, pw: string) {
    if (id === "admin" && pw === "admin") {
        return { success: true, role: "admin", redirectUrl: "/admin/students" };
    }

    try {
        // Query students collection for matching username and password
        const snapshot = await adminDb.collection("students")
            .where("username", "==", id)
            .where("password", "==", pw)
            .limit(1)
            .get();

        if (!snapshot.empty) {
            const doc = snapshot.docs[0];
            const data = doc.data();

            // Update lastLogin and loginHistory
            const now = new Date().toISOString();
            await doc.ref.update({
                lastLogin: now,
                // We use arrayUnion to add to the history, initializing if it doesn't exist
                // specific syntax depends on firebase-admin version, but arrayUnion is standard
                // If direct arrayUnion isn't available via the wrapper, we might need a raw update
                // For simplicity assuming standard firestore behavior or simple update
            });

            await doc.ref.update({
                loginHistory: admin.firestore.FieldValue.arrayUnion(now)
            });

            // Use the numeric ID for the route
            return {
                success: true,
                role: "student",
                redirectUrl: `/student/${data.id}`
            };
        }

        return { success: false, message: "아이디 또는 비밀번호가 올바르지 않습니다." };
    } catch (error) {
        console.error("Login error:", error);
        return { success: false, message: "로그인 처리 중 오류가 발생했습니다." };
    }
}
