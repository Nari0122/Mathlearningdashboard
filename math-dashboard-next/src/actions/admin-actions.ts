"use server";

import { learningService } from "@/services/learningService";
import { revalidatePath } from "next/cache";

export async function createUnit(docId: string, data: {
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
    const result = await learningService.createUnit(docId, data);
    if (result.success) {
        revalidatePath(`/dashboard`);
    }
    return result;
}

export async function createSchedule(docId: string, data: { date: string; startTime: string; endTime: string; status: string; isRegular: boolean; dayOfWeek?: string; sessionNumber?: number }) {
    const result = await learningService.createSchedule(docId, data);
    if (result.success) {
        revalidatePath(`/admin/students/${docId}/schedule`);
    }
    return result;
}

export async function updateSchedule(docId: string, scheduleId: string, data: any, originalSnapshot?: any, force: boolean = false) {
    if (force) {
        const result = await learningService.updateSchedule(docId, scheduleId, data);
        if (result.success) {
            revalidatePath(`/admin/students/${docId}/schedule`);
        }
        return result;
    }

    const currentData = await learningService.getSchedule(docId, scheduleId) as any;
    if (!currentData) {
        return { success: false, message: "Schedule not found" };
    }

    if (originalSnapshot) {
        const isConflict =
            currentData.date !== originalSnapshot.date ||
            currentData.startTime !== originalSnapshot.startTime ||
            currentData.endTime !== originalSnapshot.endTime ||
            currentData.dayOfWeek !== originalSnapshot.dayOfWeek ||
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

    const result = await learningService.updateSchedule(docId, scheduleId, data);
    if (result.success) {
        revalidatePath(`/admin/students/${docId}/schedule`);
    }
    return result;
}

export async function deleteSchedule(id: string, docId: string) {
    const result = await learningService.deleteSchedule(docId, id);
    if (result.success) {
        revalidatePath(`/admin/students/${docId}/schedule`);
    }
    return result;
}

/** 수업 일정 연기/보강/취소/일정변경: 기존 일정 상태 변경 + (취소 제외) 신규 일정 생성 */
export type ScheduleChangeType = "보강" | "연기" | "취소" | "일정변경";

export async function postponeOrChangeSchedule(
    docId: string,
    originScheduleId: string,
    payload: {
        changeType: ScheduleChangeType;
        reason: string;
        newDate?: string;
        newStartTime?: string;
        newEndTime?: string;
    }
) {
    const origin = await learningService.getSchedule(docId, originScheduleId) as any;
    if (!origin || origin.isRegular) {
        return { success: false, message: "해당 일정을 찾을 수 없거나 정규 일정은 변경할 수 없습니다." };
    }

    const { changeType, reason, newDate, newStartTime, newEndTime } = payload;

    if (changeType === "취소") {
        const result = await learningService.updateSchedule(docId, originScheduleId, {
            status: "CANCELLED",
            isModified: true,
            changeType: "취소",
            changeReason: reason || undefined,
        });
        if (result.success) revalidatePath(`/admin/students/${docId}/schedule`);
        return result;
    }

    if (!newDate || !newStartTime || !newEndTime) {
        return { success: false, message: "새 날짜와 시간을 입력해주세요." };
    }

    const originStatus = changeType === "연기" ? "POSTPONED" : "CHANGED";
    const updateResult = await learningService.updateSchedule(docId, originScheduleId, {
        status: originStatus,
        isModified: true,
        changeType,
        changeReason: reason || undefined,
    });
    if (!updateResult.success) return updateResult;

    const createResult = await learningService.createSchedule(docId, {
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

    revalidatePath(`/admin/students/${docId}/schedule`);
    return { success: true };
}

export async function createHomework(
    docId: string,
    data: { title: string; dueDate: string; assignedDate: string; linkedScheduleId?: string }
) {
    const { submissionDeadlineFromSchedule } = await import("@/lib/submissionDeadline");
    let submissionDeadline: string;
    if (data.linkedScheduleId) {
        const schedule = await learningService.getSchedule(docId, data.linkedScheduleId) as { date?: string; startTime?: string } | null;
        if (schedule?.date && schedule?.startTime) {
            submissionDeadline = submissionDeadlineFromSchedule(schedule.date, schedule.startTime);
        } else {
            submissionDeadline = `${data.dueDate}T23:59:59+09:00`;
        }
    } else {
        submissionDeadline = `${data.dueDate}T23:59:59+09:00`;
    }
    const payload = {
        ...data,
        status: "pending",
        progress: "none" as const,
        submissionDeadline,
        ...(data.linkedScheduleId && { linkedScheduleId: data.linkedScheduleId }),
    };
    const result = await learningService.createAssignment(docId, payload);
    if (result.success) {
        revalidatePath(`/admin/students/${docId}/homework`);
    }
    return result;
}

export async function updateHomework(id: number | string, docId: string, data: { title: string; dueDate: string; status?: string; submittedDate?: string | null }) {
    const result = await learningService.updateAssignment(docId, String(id), data);
    if (result.success) {
        revalidatePath(`/admin/students/${docId}/homework`);
    }
    return result;
}

export async function updateHomeworkProgress(
    id: string,
    docId: string,
    progress: "none" | "little" | "half" | "almost" | "done",
    changedByAdmin: boolean = false
) {
    const { toKSTISOString } = await import("@/lib/date-kst");
    const { getSubmissionDeadline } = await import("@/lib/submissionDeadline");

    const homeworks = await learningService.getAssignments(docId);
    const hw = homeworks.find((h: any) => h.id === id) as any;

    const updateData: Record<string, any> = {
        progress,
        progressChangedByAdmin: changedByAdmin,
        lastModifiedDate: toKSTISOString(),
    };

    // 마감 후 수정 여부 판별
    if (hw) {
        const deadline = getSubmissionDeadline(hw);
        updateData.isLateUpdate = new Date() >= deadline;
    }

    // 진척도(안 함~완료)는 제출 상태·제출 시각과 분리: 어떤 진척도를 골라도 마감·제출 마감 시각은 그대로 두고,
    // formal 제출은 submitHomework / 관리자 제출 처리 등 별도 경로에서만 갱신합니다.

    const result = await learningService.updateAssignment(docId, id, updateData);
    if (result.success) {
        revalidatePath(`/admin/students/${docId}/homework`);
        revalidatePath(`/admin/students/${docId}`);
        revalidatePath(`/student/${docId}/homework`);
        revalidatePath(`/student/${docId}`);
        revalidatePath(`/parent`, 'layout');
    }
    return result;
}

export async function deleteHomework(id: string, docId: string) {
    const result = await learningService.deleteAssignment(docId, id);
    if (result.success) {
        revalidatePath(`/admin/students/${docId}/homework`);
    }
    return result;
}

export async function updateUnit(id: number, docId: string, data: any) {
    const result = await learningService.updateUnit(docId, id, data);
    if (result.success) {
        revalidatePath(`/dashboard`);
    }
    return result;
}

export async function deleteUnit(id: number, docId: string) {
    const result = await learningService.deleteUnit(docId, id);
    if (result.success) {
        revalidatePath(`/dashboard`);
    }
    return result;
}

export async function updateUnitError(unitId: number, docId: string, errorType: 'C' | 'M' | 'R' | 'S', delta: number) {
    const result = await learningService.updateUnitError(docId, unitId, errorType, delta);
    if (result.success) {
        revalidatePath(`/dashboard`);
    }
    return result;
}
