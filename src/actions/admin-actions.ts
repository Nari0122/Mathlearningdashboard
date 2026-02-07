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

export async function updateSchedule(studentId: number, scheduleId: string, data: any, originalSnapshot?: any, force: boolean = false) {
    // 1. If force save, skip checks
    if (force) {
        const result = await learningService.updateSchedule(studentId, scheduleId, data);
        if (result.success) {
            revalidatePath(`/admin/students/${studentId}/schedule`);
        }
        return result;
    }

    // 2. Fetch current data for conflict check
    const currentData = await learningService.getSchedule(studentId, scheduleId) as any;
    if (!currentData) {
        return { success: false, message: "Schedule not found" };
    }

    // 3. Compare with snapshot
    // If originalSnapshot is provided, check if currentData matches it.
    // If mismatch, it means someone else changed it.
    if (originalSnapshot) {
        const isConflict =
            currentData.date !== originalSnapshot.date ||
            currentData.startTime !== originalSnapshot.startTime ||
            currentData.endTime !== originalSnapshot.endTime ||
            currentData.dayOfWeek !== originalSnapshot.dayOfWeek || // for regular
            currentData.isRegular !== originalSnapshot.isRegular;

        if (isConflict) {
            return {
                success: false,
                conflict: true,
                message: "Information has been changed on the server.",
                latestData: currentData
            };
        }
    }

    // 4. Update
    const result = await learningService.updateSchedule(studentId, scheduleId, data);
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

/** 수업 일정 연기/보강/취소/일정변경: 기존 일정 상태 변경 + (취소 제외) 신규 일정 생성 */
export type ScheduleChangeType = "보강" | "연기" | "취소" | "일정변경";

export async function postponeOrChangeSchedule(
    studentId: number,
    originScheduleId: string,
    payload: {
        changeType: ScheduleChangeType;
        reason: string;
        newDate?: string;
        newStartTime?: string;
        newEndTime?: string;
    }
) {
    const origin = await learningService.getSchedule(studentId, originScheduleId) as any;
    if (!origin || origin.isRegular) {
        return { success: false, message: "해당 일정을 찾을 수 없거나 정규 일정은 변경할 수 없습니다." };
    }

    const { changeType, reason, newDate, newStartTime, newEndTime } = payload;

    if (changeType === "취소") {
        const result = await learningService.updateSchedule(studentId, originScheduleId, {
            status: "CANCELLED",
            isModified: true,
            changeType: "취소",
            changeReason: reason || undefined,
        });
        if (result.success) revalidatePath(`/admin/students/${studentId}/schedule`);
        return result;
    }

    if (!newDate || !newStartTime || !newEndTime) {
        return { success: false, message: "새 날짜와 시간을 입력해주세요." };
    }

    const originStatus = changeType === "연기" ? "POSTPONED" : "CHANGED";
    const updateResult = await learningService.updateSchedule(studentId, originScheduleId, {
        status: originStatus,
        isModified: true,
        changeType,
        changeReason: reason || undefined,
    });
    if (!updateResult.success) return updateResult;

    const createResult = await learningService.createSchedule(studentId, {
        date: newDate,
        startTime: newStartTime,
        endTime: newEndTime,
        status: "scheduled",
        isRegular: false,
        sessionNumber: origin.sessionNumber,
        scheduleChangeType: changeType,
        originScheduleId,
        changeReason: reason || undefined,
    });
    if (!createResult.success) return createResult;

    revalidatePath(`/admin/students/${studentId}/schedule`);
    return { success: true };
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
