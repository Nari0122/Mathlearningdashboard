/**
 * 과제 최종 제출 마감 시각 계산 (클라이언트/서버 공용, Firebase 미의존)
 * - submissionDeadline 있으면 해당 시각
 * - 없으면 dueDate(YYYY-MM-DD) 당일 23:59:59 Asia/Seoul
 */
export function getSubmissionDeadline(assignment: {
    submissionDeadline?: string | null;
    dueDate: string;
}): Date {
    if (assignment.submissionDeadline) {
        return new Date(assignment.submissionDeadline);
    }
    const due = assignment.dueDate || "";
    return new Date(`${due}T23:59:59+09:00`);
}

/** 정규 마감 시각이 지났는지 (수업 1시간 전 또는 dueDate 23:59:59) */
export function isSubmissionLocked(assignment: {
    submissionDeadline?: string | null;
    dueDate: string;
}): boolean {
    return new Date() >= getSubmissionDeadline(assignment);
}

/**
 * 지각 제출 마감 시각: 정규 마감일 기준 다음날 23:59:59 KST
 * 예) 정규 마감 2/25 15:00 → 지각 마감 2/26 23:59:59
 */
export function getLateSubmissionDeadline(assignment: {
    submissionDeadline?: string | null;
    dueDate: string;
}): Date {
    const normalDeadline = getSubmissionDeadline(assignment);
    const kstDateStr = normalDeadline.toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
    const [y, m, d] = kstDateStr.split("-").map(Number);
    const nextDate = new Date(y, m - 1, d + 1);
    const yy = nextDate.getFullYear();
    const mm = String(nextDate.getMonth() + 1).padStart(2, "0");
    const dd = String(nextDate.getDate()).padStart(2, "0");
    return new Date(`${yy}-${mm}-${dd}T23:59:59+09:00`);
}

/** 지각 제출 마감(다음날 밤 23:59:59)까지 지났는지 */
export function isLateSubmissionLocked(assignment: {
    submissionDeadline?: string | null;
    dueDate: string;
}): boolean {
    return new Date() >= getLateSubmissionDeadline(assignment);
}

/**
 * 수업 date + startTime 기준 1시간 전 시각을 ISO 문자열로 (Asia/Seoul)
 */
export function submissionDeadlineFromSchedule(date: string, startTime: string): string {
    const [h, m] = startTime.split(":").map(Number);
    const start = new Date(`${date}T${String(h).padStart(2, "0")}:${String(m || 0).padStart(2, "0")}:00+09:00`);
    const oneHourBefore = new Date(start.getTime() - 60 * 60 * 1000);
    return oneHourBefore.toISOString();
}
