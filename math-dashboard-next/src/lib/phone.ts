/** 전화번호 최대 자릿수 */
export const PHONE_MAX_LENGTH = 11;

/**
 * 문자열에서 숫자만 추출하고 최대 11자리로 자른다.
 * 저장·비교용으로 사용 (숫자만).
 */
export function getPhoneDigits(value: string): string {
    const digits = value.replace(/\D/g, "");
    return digits.slice(0, PHONE_MAX_LENGTH);
}

/**
 * 숫자만 있는 전화번호를 000-0000-0000 형식으로 포맷.
 * 화면 표시·입력 필드 표시용.
 */
export function formatPhoneDisplay(phone: string): string {
    const digits = getPhoneDigits(phone);
    if (digits.length <= 3) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}
