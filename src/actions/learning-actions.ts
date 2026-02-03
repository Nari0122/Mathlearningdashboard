"use server";

import { learningService } from "@/services/learningService";
import { revalidatePath } from "next/cache";

export interface CreateIncorrectNoteData {
    unitId: number;
    problemName: string;
    memo: string;
    errorType: string;
    questionImg?: string;
}

export async function createIncorrectNote(studentId: number, data: CreateIncorrectNoteData) {
    const result = await learningService.createIncorrectNote(studentId, data);
    if (result.success) {
        revalidatePath(`/student/${studentId}/incorrect-notes`);
        revalidatePath(`/admin/students/${studentId}/incorrect-notes`);
    }
    return result;
}

export async function updateIncorrectNote(studentId: number, noteId: string, data: any) {
    const result = await learningService.updateIncorrectNote(studentId, noteId, data);
    if (result.success) {
        revalidatePath(`/student/${studentId}/incorrect-notes`);
        revalidatePath(`/admin/students/${studentId}/incorrect-notes`);
    }
    return result;
}
