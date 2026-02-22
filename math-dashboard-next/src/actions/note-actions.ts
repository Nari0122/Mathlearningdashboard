"use server";

import { learningService } from "@/services/learningService";
import { revalidatePath } from "next/cache";

export async function getIncorrectNotes(userId: number) {
    try {
        return await learningService.getIncorrectNotes(userId);
    } catch (error) {
        return [];
    }
}

export async function addIncorrectNote(userId: number, unitId: number, problemName: string, errorType: string, memo: string, questionImg?: string) {
    try {
        await learningService.createIncorrectNote(userId, {
            unitId,
            problemName,
            errorType,
            memo,
            questionImg,
            isResolved: false
        });
        revalidatePath("/study/incorrect-notes");
        return { success: true };
    } catch (error) {
        return { success: false };
    }
}

export async function resolveNote(userId: number, noteId: string, isResolved: boolean) {
    try {
        await learningService.updateIncorrectNote(userId, noteId, { isResolved });
        revalidatePath("/study/incorrect-notes");
        return { success: true };
    } catch (error) {
        return { success: false };
    }
}

export async function deleteNote(userId: number, noteId: string) {
    try {
        await learningService.deleteIncorrectNote(userId, noteId);
        revalidatePath("/study/incorrect-notes");
        return { success: true };
    } catch (error) {
        return { success: false };
    }
}
