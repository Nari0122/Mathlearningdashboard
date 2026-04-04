import { toKSTISOString } from "@/lib/date-kst";
import { formatRemainingKoreanDayHourMinute } from "@/lib/deadlineCountdownFormat";

/**
 * 복습 제출 마감: 선택한 수업의 종료 시각 + 2시간 (KST date + endTime 기준)
 * 숙제 마감(수업 시작 1시간 전)과 별도 규칙입니다.
 */
export function classEndAndReviewDeadline(date: string, endTime: string): { classEndTime: string; deadline: string } {
    const [h, m] = endTime.split(":").map(Number);
    const wall = `${date}T${String(h).padStart(2, "0")}:${String(m || 0).padStart(2, "0")}:00+09:00`;
    const end = new Date(wall);
    const deadline = new Date(end.getTime() + 2 * 60 * 60 * 1000);
    return {
        classEndTime: toKSTISOString(end),
        deadline: toKSTISOString(deadline),
    };
}

export function isPastReviewDeadline(deadlineIso: string): boolean {
    return Date.now() >= new Date(deadlineIso).getTime();
}

export function formatReviewDeadlineCountdown(deadlineIso: string): { open: boolean; label: string } {
    const d = new Date(deadlineIso).getTime();
    const now = Date.now();
    if (now >= d) return { open: false, label: "마감 종료" };
    const ms = d - now;
    const inner = formatRemainingKoreanDayHourMinute(ms);
    return { open: true, label: `마감까지 ${inner} 남음` };
}
