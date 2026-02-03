"use server";

import { learningService } from "@/services/learningService";
import { revalidatePath } from "next/cache";

export async function createUnit(studentId: number, data: { name: string; grade: string; subject: string; status: string; selectedDifficulty: string }) {
    const result = await learningService.createUnit(studentId, data);
    if (result.success) {
        revalidatePath(`/admin/students/${studentId}/learning`);
        revalidatePath(`/study/my-learning`);
        revalidatePath(`/dashboard`);
    }
    return result;
}

export async function createSchedule(studentId: number, data: { date: string; startTime: string; endTime: string; status: string; isRegular: boolean; dayOfWeek?: string; sessionNumber?: number }) {
    const result = await learningService.createSchedule(studentId, data);
    if (result.success) {
        revalidatePath(`/admin/students/${studentId}/schedule`);
    }
    return result;
}

export async function deleteSchedule(id: string, studentId: number) {
    const result = await learningService.deleteSchedule(studentId, id);
    if (result.success) {
        revalidatePath(`/admin/students/${studentId}/schedule`);
    }
    return result;
}

export async function createHomework(studentId: number, data: { title: string; dueDate: string; assignedDate: string }) {
    const result = await learningService.createAssignment(studentId, data);
    if (result.success) {
        revalidatePath(`/admin/students/${studentId}/homework`);
    }
    return result;
}

export async function updateHomework(id: number | string, studentId: number, data: { title: string; dueDate: string }) {
    const result = await learningService.updateAssignment(studentId, String(id), data);
    if (result.success) {
        revalidatePath(`/admin/students/${studentId}/homework`);
    }
    return result;
}

export async function deleteHomework(id: string, studentId: number) {
    const result = await learningService.deleteAssignment(studentId, id);
    if (result.success) {
        revalidatePath(`/admin/students/${studentId}/homework`);
    }
    return result;
}

export async function createExam(studentId: number, data: { examType: string; subject: string; date: string; score: number }) {
    const result = await learningService.createExam(studentId, data);
    if (result.success) {
        revalidatePath(`/admin/students/${studentId}/exams`);
    }
    return result;
}

export async function updateExam(examId: number | string, studentId: number, data: { examType: string; subject: string; date: string; score: number }) {
    const result = await learningService.updateExam(studentId, String(examId), data);
    if (result.success) {
        revalidatePath(`/admin/students/${studentId}/exams`);
    }
    return result;
}

export async function deleteExam(examId: number | string, studentId: number) {
    const result = await learningService.deleteExam(studentId, String(examId));
    if (result.success) {
        revalidatePath(`/admin/students/${studentId}/exams`);
    }
    return result;
}

export async function createLearningRecord(studentId: number, data: { date: string; progress: string; comment: string }) {
    const result = await learningService.createLearningRecord(studentId, data);
    if (result.success) {
        revalidatePath(`/admin/students/${studentId}/history`);
    }
    return result;
}

export async function updateLearningRecord(recordId: number | string, studentId: number, data: { date: string; progress: string; comment: string }) {
    const result = await learningService.updateLearningRecord(studentId, String(recordId), data);
    if (result.success) {
        revalidatePath(`/admin/students/${studentId}/history`);
    }
    return result;
}

export async function deleteLearningRecord(recordId: number | string, studentId: number) {
    const result = await learningService.deleteLearningRecord(studentId, String(recordId));
    if (result.success) {
        revalidatePath(`/admin/students/${studentId}/history`);
    }
    return result;
}

export async function updateUnit(id: number, studentId: number, data: any) {
    const result = await learningService.updateUnit(studentId, id, data);
    if (result.success) {
        revalidatePath(`/admin/students/${studentId}/learning`);
        revalidatePath(`/study/my-learning`);
        revalidatePath(`/dashboard`);
    }
    return result;
}

export async function deleteUnit(id: number, studentId: number) {
    const result = await learningService.deleteUnit(studentId, id);
    if (result.success) {
        revalidatePath(`/admin/students/${studentId}/learning`);
        revalidatePath(`/study/my-learning`);
        revalidatePath(`/dashboard`);
    }
    return result;
}

export async function updateUnitError(unitId: number, studentId: number, errorType: 'C' | 'M' | 'R' | 'S', delta: number) {
    const result = await learningService.updateUnitError(studentId, unitId, errorType, delta);
    if (result.success) {
        revalidatePath(`/admin/students/${studentId}/learning`);
        revalidatePath(`/study/my-learning`);
        revalidatePath(`/dashboard`);
    }
    return result;
}
