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

export function isSubmissionLocked(assignment: {
    submissionDeadline?: string | null;
    dueDate: string;
}): boolean {
    return new Date() >= getSubmissionDeadline(assignment);
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
