"use server";

import { learningService } from "@/services/learningService";
import { revalidatePath } from "next/cache";

export async function getIncorrectNotes(docId: string) {
    try {
        return await learningService.getIncorrectNotes(docId);
    } catch (error) {
        return [];
    }
}

export async function addIncorrectNote(docId: string, unitId: number, problemName: string, errorType: string, memo: string, questionImg?: string) {
    try {
        await learningService.createIncorrectNote(docId, {
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

export async function resolveNote(docId: string, noteId: string, isResolved: boolean) {
    try {
        await learningService.updateIncorrectNote(docId, noteId, { isResolved });
        revalidatePath("/study/incorrect-notes");
        return { success: true };
    } catch (error) {
        return { success: false };
    }
}

export async function deleteNote(docId: string, noteId: string) {
    try {
        await learningService.deleteIncorrectNote(docId, noteId);
        revalidatePath("/study/incorrect-notes");
        return { success: true };
    } catch (error) {
        return { success: false };
    }
}
