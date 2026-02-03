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
    // Curriculum info
    schoolLevel?: string;
    grade?: string;
    subject?: string;
    unitName?: string;
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

export async function deleteIncorrectNote(studentId: number, noteId: string) {
    const result = await learningService.deleteIncorrectNote(studentId, noteId);
    if (result.success) {
        revalidatePath(`/student/${studentId}/incorrect-notes`);
        revalidatePath(`/admin/students/${studentId}/incorrect-notes`);
    }
    return result;
}

// Exam Actions
export async function createExam(studentId: number, data: { examType: string; subject: string; date: string; score: number }) {
    const result = await learningService.createExam(studentId, data);
    if (result.success) {
        revalidatePath(`/admin/students/${studentId}/exams`);
        revalidatePath(`/student/${studentId}/exams`);
    }
    return result;
}

export async function updateExam(examId: string, studentId: number, data: { examType: string; subject: string; date: string; score: number }) {
    const result = await learningService.updateExam(studentId, examId, data);
    if (result.success) {
        revalidatePath(`/admin/students/${studentId}/exams`);
        revalidatePath(`/student/${studentId}/exams`);
    }
    return result;
}

export async function deleteExam(examId: string, studentId: number) {
    const result = await learningService.deleteExam(studentId, examId);
    if (result.success) {
        revalidatePath(`/admin/students/${studentId}/exams`);
        revalidatePath(`/student/${studentId}/exams`);
    }
    return result;
}

// Learning Record Actions
export async function createLearningRecord(studentId: number, data: { date: string; progress: string; comment: string; createdBy?: string }) {
    const result = await learningService.createLearningRecord(studentId, {
        ...data,
        createdBy: data.createdBy || "student"
    });
    if (result.success) {
        revalidatePath(`/admin/students/${studentId}/history`);
        revalidatePath(`/student/${studentId}/history`);
    }
    return result;
}

export async function updateLearningRecord(recordId: string, studentId: number, data: { date: string; progress: string; comment: string }) {
    const result = await learningService.updateLearningRecord(studentId, recordId, data);
    if (result.success) {
        revalidatePath(`/admin/students/${studentId}/history`);
        revalidatePath(`/student/${studentId}/history`);
    }
    return result;
}

export async function deleteLearningRecord(recordId: string, studentId: number) {
    const result = await learningService.deleteLearningRecord(studentId, recordId);
    if (result.success) {
        revalidatePath(`/admin/students/${studentId}/history`);
        revalidatePath(`/student/${studentId}/history`);
    }
    return result;
}
