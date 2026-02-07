/**
 * 회원가입/소셜 로그인 시 역할(학생/학부모) 전달용 쿠키.
 * NextAuth 콜백에서 이 쿠키를 읽어 신규 유저 리다이렉트 URL 결정.
 */
export const AUTH_SIGNUP_ROLE_COOKIE = "signup_role";

/**
 * 역할·승인 상태에 따른 홈 경로
 */
export function getHomePathByRole(role: string, status?: string): string {
    if (role === "ADMIN") return "/admin/students";
    if (role === "PARENT") return "/parent/dashboard";
    if (role === "STUDENT") {
        if (status === "PENDING") return "/pending-approval";
        return "/dashboard"; // STUDENT APPROVED → 기존 대시보드 또는 /student/[id] 등
    }
    return "/dashboard";
}
