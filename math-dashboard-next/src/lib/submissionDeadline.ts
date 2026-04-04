import { toKSTISOString } from "@/lib/date-kst";

export interface AssignmentDeadlineInfo {
    submissionDeadline?: string | null;
    linkedScheduleId?: string | null;
    dueDate: string;
}

/**
 * 과제 정규 제출 마감 시각 (클라이언트/서버 공용, Firebase 미의존)
 * - submissionDeadline 있으면 해당 시각 (수업 1시간 전)
 * - 없으면 dueDate(YYYY-MM-DD) 당일 23:59:59 Asia/Seoul
 */
export function getSubmissionDeadline(assignment: AssignmentDeadlineInfo): Date {
    if (assignment.submissionDeadline) {
        return new Date(assignment.submissionDeadline);
    }
    const due = assignment.dueDate || "";
    return new Date(`${due}T23:59:59+09:00`);
}

/** 정규 마감 시각이 지났는지 (수업 1시간 전 또는 dueDate 23:59:59) */
export function isSubmissionLocked(assignment: AssignmentDeadlineInfo): boolean {
    return new Date() >= getSubmissionDeadline(assignment);
}

/**
 * UI용 남은 시간 문구 (정규 제출 마감 기준, `getSubmissionDeadline`과 동일)
 */
export function formatSubmissionDeadlineCountdown(assignment: AssignmentDeadlineInfo): { open: boolean; label: string } {
    const deadline = getSubmissionDeadline(assignment);
    const end = deadline.getTime();
    const now = Date.now();
    if (now >= end) {
        return { open: false, label: "제출 마감" };
    }
    const ms = end - now;
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    if (h <= 0 && m <= 0) {
        return { open: true, label: "마감까지 1분 미만 남음" };
    }
    return { open: true, label: `마감까지 ${h}시간 ${m}분 남음` };
}

/**
 * 지각 제출 마감 시각
 * - 수업 연동 과제: 수업 시작 10분 전 (정규 마감 + 50분)
 * - 수업 미연동 과제: 마감일 다음날 23:59:59 KST
 */
export function getLateSubmissionDeadline(assignment: AssignmentDeadlineInfo): Date {
    const normalDeadline = getSubmissionDeadline(assignment);

    if (assignment.linkedScheduleId) {
        return new Date(normalDeadline.getTime() + 50 * 60 * 1000);
    }

    const kstDateStr = normalDeadline.toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
    const [y, m, d] = kstDateStr.split("-").map(Number);
    const nextDate = new Date(y, m - 1, d + 1);
    const yy = nextDate.getFullYear();
    const mm = String(nextDate.getMonth() + 1).padStart(2, "0");
    const dd = String(nextDate.getDate()).padStart(2, "0");
    return new Date(`${yy}-${mm}-${dd}T23:59:59+09:00`);
}

/** 지각 제출 마감까지 지났는지 */
export function isLateSubmissionLocked(assignment: AssignmentDeadlineInfo): boolean {
    return new Date() >= getLateSubmissionDeadline(assignment);
}

/**
 * 수업 date + startTime 기준 1시간 전 시각을 KST ISO 문자열로 반환
 */
export function submissionDeadlineFromSchedule(date: string, startTime: string): string {
    const [h, m] = startTime.split(":").map(Number);
    const start = new Date(`${date}T${String(h).padStart(2, "0")}:${String(m || 0).padStart(2, "0")}:00+09:00`);
    const oneHourBefore = new Date(start.getTime() - 60 * 60 * 1000);
    return toKSTISOString(oneHourBefore);
}
