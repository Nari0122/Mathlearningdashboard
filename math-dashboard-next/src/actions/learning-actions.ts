"use server";

import { learningService } from "@/services/learningService";
import { revalidatePath } from "next/cache";

export interface CreateIncorrectNoteData {
    unitId: number;
    problemName: string;
    memo: string;
    errorType: string;
    questionImg?: string;
    unitDetail?: string;
    retryCount?: number;
    attachments?: any[];
    bookTagId?: string; // NEW: for searchKey
    // Curriculum info
    schoolLevel?: string;
    grade?: string;
    subject?: string;
    unitName?: string;
}

export async function createIncorrectNote(docId: string, data: CreateIncorrectNoteData) {
    if (data.retryCount !== undefined && (data.retryCount < 1 || data.retryCount > 5)) {
        return { success: false, message: "틀린 횟수는 1~5 사이여야 합니다." };
    }

    const result = await learningService.createIncorrectNote(docId, data);
    if (result.success) {
        revalidatePath(`/student/${docId}/incorrect-notes`);
        revalidatePath(`/admin/students/${docId}/incorrect-notes`);
    }
    return result;
}

export async function updateIncorrectNote(docId: string, noteId: string, data: any) {
    if (data.retryCount !== undefined && (data.retryCount < 1 || data.retryCount > 5)) {
        return { success: false, message: "틀린 횟수는 1~5 사이여야 합니다." };
    }

    const result = await learningService.updateIncorrectNote(docId, noteId, data);
    if (result.success) {
        revalidatePath(`/student/${docId}/incorrect-notes`);
        revalidatePath(`/admin/students/${docId}/incorrect-notes`);
    }
    return result;
}

export async function deleteIncorrectNote(docId: string, noteId: string) {
    const result = await learningService.deleteIncorrectNote(docId, noteId);
    if (result.success) {
        revalidatePath(`/student/${docId}/incorrect-notes`);
        revalidatePath(`/admin/students/${docId}/incorrect-notes`);
    }
    return result;
}

// ========== BookTag Actions ==========
export async function getBookTags(docId: string) {
    return await learningService.getBookTags(docId);
}

export async function createBookTag(docId: string, name: string) {
    return await learningService.createBookTag(docId, name);
}

// ========== Advanced Search Action ==========
export async function searchIncorrectNotes(docId: string, searchKeys: string[]) {
    return await learningService.searchIncorrectNotes(docId, searchKeys);
}

// Exam Actions
export async function createExam(docId: string, data: { examType: string; subject: string; date: string; score: number }) {
    const result = await learningService.createExam(docId, data);
    if (result.success) {
        revalidatePath(`/admin/students/${docId}/exams`);
        revalidatePath(`/student/${docId}/exams`);
    }
    return result;
}

export async function updateExam(examId: string, docId: string, data: { examType: string; subject: string; date: string; score: number }) {
    const result = await learningService.updateExam(docId, examId, data);
    if (result.success) {
        revalidatePath(`/admin/students/${docId}/exams`);
        revalidatePath(`/student/${docId}/exams`);
    }
    return result;
}

export async function deleteExam(examId: string, docId: string) {
    const result = await learningService.deleteExam(docId, examId);
    if (result.success) {
        revalidatePath(`/admin/students/${docId}/exams`);
        revalidatePath(`/student/${docId}/exams`);
    }
    return result;
}

// Learning Record Actions
export async function createLearningRecord(docId: string, data: { date: string; progress: string; comment: string; sessionNumber?: number; createdBy?: string }) {
    const result = await learningService.createLearningRecord(docId, {
        ...data,
        createdBy: data.createdBy || "student"
    });
    if (result.success) {
        revalidatePath(`/admin/students/${docId}/history`);
        revalidatePath(`/student/${docId}/history`);
    }
    return result;
}

export async function updateLearningRecord(recordId: string, docId: string, data: { date: string; progress: string; comment: string; sessionNumber?: number }) {
    const result = await learningService.updateLearningRecord(docId, recordId, data);
    if (result.success) {
        revalidatePath(`/admin/students/${docId}/history`);
        revalidatePath(`/student/${docId}/history`);
    }
    return result;
}

export async function deleteLearningRecord(recordId: string, docId: string) {
    const result = await learningService.deleteLearningRecord(docId, recordId);
    if (result.success) {
        revalidatePath(`/admin/students/${docId}/history`);
        revalidatePath(`/student/${docId}/history`);
    }
    return result;
}
