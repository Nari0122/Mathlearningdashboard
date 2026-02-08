/**
 * 회원가입/소셜 로그인 시 역할(학생/학부모) 전달용 쿠키.
 * NextAuth 콜백에서 이 쿠키를 읽어 신규 유저 리다이렉트 URL 결정.
 */
export const AUTH_SIGNUP_ROLE_COOKIE = "signup_role";

/** /admin-login에서 카카오 로그인 시 콜백을 /admin-login/callback으로 보내기 위한 쿠키 */
export const AUTH_ADMIN_LOGIN_FLOW_COOKIE = "admin_login_flow";

/** /admin-login 회원가입 버튼 클릭 시 intent=signup 전달용 쿠키 */
export const AUTH_ADMIN_SIGNUP_INTENT_COOKIE = "admin_signup_intent";

/**
 * 역할·승인 상태에 따른 홈 경로 (테스트용 통합 로그인 리다이렉트)
 * - SUPER_ADMIN: 관리자 대시보드 (관리자 관리 메뉴 포함)
 * - ADMIN + APPROVED: 관리자 대시보드
 * - ADMIN + PENDING: 승인 대기 페이지
 */
export function getHomePathByRole(role: string, status?: string): string {
    if (role === "SUPER_ADMIN") {
        if (status === "PENDING") return "/admin-pending";
        return "/admin/students";
    }
    if (role === "ADMIN") {
        if (status === "PENDING") return "/admin-pending";
        return "/admin/students";
    }
    if (role === "PARENT") return "/parent"; // /parent에서 세션 uid로 /parent/[uid]/dashboard 리다이렉트
    if (role === "STUDENT") {
        if (status === "PENDING") return "/pending-approval";
        return "/dashboard";
    }
    return "/dashboard";
}
