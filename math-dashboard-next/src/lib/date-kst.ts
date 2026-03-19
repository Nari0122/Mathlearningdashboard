const KST_OFFSET = 9 * 60 * 60 * 1000;

/**
 * 현재 시각을 KST ISO 문자열로 반환 (예: "2025-03-19T14:30:00+09:00")
 * 서버(UTC) 환경에서도 항상 한국 시간 기준 문자열을 생성한다.
 */
export function toKSTISOString(date?: Date): string {
    const d = date ?? new Date();
    const kst = new Date(d.getTime() + KST_OFFSET);
    const iso = kst.toISOString(); // "YYYY-MM-DDTHH:mm:ss.sssZ"
    return iso.replace("Z", "+09:00");
}

/** 현재 시각의 KST 날짜 문자열 (YYYY-MM-DD) */
export function todayKSTString(date?: Date): string {
    return toKSTISOString(date).slice(0, 10);
}
