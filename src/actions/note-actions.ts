"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getIncorrectNotes(userId: number) {
    try {
        return await db.incorrectNote.findMany({
            where: { userId },
            include: { unit: true },
            orderBy: { createdAt: 'desc' }
        });
    } catch (error) {
        return [];
    }
}

export async function addIncorrectNote(userId: number, unitId: number, problemName: string, errorType: string, memo: string, questionImg?: string) {
    try {
        await db.incorrectNote.create({
            data: {
                userId,
                unitId,
                problemName,
                errorType,
                memo,
                questionImg, // Save the image URL
                isResolved: false
            }
        });
        revalidatePath("/study/incorrect-notes");
        return { success: true };
    } catch (error) {
        return { success: false };
    }
}

export async function resolveNote(noteId: number, isResolved: boolean) {
    try {
        await db.incorrectNote.update({
            where: { id: noteId },
            data: { isResolved }
        });
        revalidatePath("/study/incorrect-notes");
        return { success: true };
    } catch (error) {
        return { success: false };
    }
}

export async function deleteNote(noteId: number) {
    try {
        await db.incorrectNote.delete({ where: { id: noteId } });
        revalidatePath("/study/incorrect-notes");
        return { success: true };
    } catch (error) {
        return { success: false };
    }
}
