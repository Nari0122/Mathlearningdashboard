"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getHomeworks(studentId: number) {
    try {
        const homeworks = await db.homework.findMany({
            where: { userId: studentId },
            orderBy: { dueDate: 'desc' },
        });
        return homeworks;
    } catch (error) {
        console.error("Error fetching homeworks:", error);
        return [];
    }
}

export async function updateHomeworkStatus(homeworkId: number, status: 'pending' | 'submitted') {
    try {
        await db.homework.update({
            where: { id: homeworkId },
            data: { status },
        });
        revalidatePath("/homework");
    } catch (error) {
        console.error("Error updating homework status:", error);
        throw new Error("Failed to update homework status");
    }
}
