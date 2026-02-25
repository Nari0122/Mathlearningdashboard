"use server";

import { learningService } from "@/services/learningService";
import { revalidatePath } from "next/cache";

export async function getHomeworks(docId: string) {
    try {
        return await learningService.getAssignments(docId);
    } catch (error) {
        console.error("Error fetching homeworks:", error);
        return [];
    }
}

export async function updateHomeworkStatus(docId: string, homeworkId: string, status: 'pending' | 'submitted') {
    try {
        await learningService.updateAssignment(docId, homeworkId, { status });
        revalidatePath("/homework");
    } catch (error) {
        console.error("Error updating homework status:", error);
        throw new Error("Failed to update homework status");
    }
}
