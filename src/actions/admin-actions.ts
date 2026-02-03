"use server";

import { learningService } from "@/services/learningService";
import { revalidatePath } from "next/cache";

export async function createUnit(studentId: number, data: {
    schoolLevel: string;
    grade: string;
    subject: string;
    unitName: string;
    unitDetails: string[];
    name: string;
    status: string;
    selectedDifficulty: string;
    completionStatus?: 'incomplete' | 'in-progress' | 'completed';
}) {
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

export async function updateHomework(id: number | string, studentId: number, data: { title: string; dueDate: string; status?: string; submittedDate?: string | null }) {
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
