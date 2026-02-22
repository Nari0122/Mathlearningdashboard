"use server";

import { learningService } from "@/services/learningService";
import { revalidatePath } from "next/cache";

export async function getHomeworks(studentId: number) {
    try {
        return await learningService.getAssignments(studentId);
    } catch (error) {
        console.error("Error fetching homeworks:", error);
        return [];
    }
}

export async function updateHomeworkStatus(studentId: number, homeworkId: string, status: 'pending' | 'submitted') {
    try {
        await learningService.updateAssignment(studentId, homeworkId, { status });
        revalidatePath("/homework");
    } catch (error) {
        console.error("Error updating homework status:", error);
        throw new Error("Failed to update homework status");
    }
}
