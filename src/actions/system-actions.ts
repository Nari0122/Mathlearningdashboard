"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getSystemSettings() {
    const settings = await db.systemSetting.findMany({
        where: {
            key: {
                in: ['support_email', 'support_phone']
            }
        }
    });

    const emailSetting = settings.find(s => s.key === 'support_email');
    const phoneSetting = settings.find(s => s.key === 'support_phone');

    return {
        supportEmail: emailSetting?.value || 'support@mathclinic.com',
        supportPhone: phoneSetting?.value || '02-1234-5678'
    };
}

export async function updateSystemSettings(email: string, phone: string) {
    try {
        await db.systemSetting.upsert({
            where: { key: 'support_email' },
            update: { value: email },
            create: { key: 'support_email', value: email }
        });

        await db.systemSetting.upsert({
            where: { key: 'support_phone' },
            update: { value: phone },
            create: { key: 'support_phone', value: phone }
        });

        revalidatePath('/'); // Revalidate everything
        return { success: true };
    } catch (error) {
        console.error("Failed to update system settings:", error);
        return { success: false, error: "Failed to update settings" };
    }
}
