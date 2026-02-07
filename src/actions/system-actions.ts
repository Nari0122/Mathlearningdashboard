"use server";

import { adminDb } from "@/lib/firebase-admin";
import { revalidatePath } from "next/cache";

export async function getSystemSettings() {
    if (!adminDb) {
        return { supportEmail: 'support@mathclinic.com', supportPhone: '02-1234-5678' };
    }
    try {
        const settingsRef = adminDb.collection("systemSettings");
        const emailDoc = await settingsRef.doc("support_email").get();
        const phoneDoc = await settingsRef.doc("support_phone").get();

        return {
            supportEmail: emailDoc.exists ? emailDoc.data()?.value : 'support@mathclinic.com',
            supportPhone: phoneDoc.exists ? phoneDoc.data()?.value : '02-1234-5678'
        };
    } catch (error) {
        console.error("Failed to fetch system settings:", error);
        return {
            supportEmail: 'support@mathclinic.com',
            supportPhone: '02-1234-5678'
        };
    }
}

export async function updateSystemSettings(email: string, phone: string) {
    if (!adminDb) {
        return { success: false, error: "Database not available" };
    }
    try {
        const settingsRef = adminDb.collection("systemSettings");

        await settingsRef.doc("support_email").set({ value: email }, { merge: true });
        await settingsRef.doc("support_phone").set({ value: phone }, { merge: true });

        revalidatePath('/'); // Revalidate everything
        return { success: true };
    } catch (error) {
        console.error("Failed to update system settings:", error);
        return { success: false, error: "Failed to update settings" };
    }
}
