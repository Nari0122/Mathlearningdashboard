/**
 * 마감까지 남은 시간을 일·시·분 한글 조각으로 (1분 미만은 "1분 미만").
 * 숙제·복습 제출 카운트다운 공통.
 */
export function formatRemainingKoreanDayHourMinute(ms: number): string {
    if (ms < 60_000) return "1분 미만";
    const days = Math.floor(ms / 86_400_000);
    const hours = Math.floor((ms % 86_400_000) / 3_600_000);
    const minutes = Math.floor((ms % 3_600_000) / 60_000);
    const parts: string[] = [];
    if (days > 0) parts.push(`${days}일`);
    if (hours > 0) parts.push(`${hours}시간`);
    if (minutes > 0) parts.push(`${minutes}분`);
    return parts.length > 0 ? parts.join(" ") : "1분 미만";
}
