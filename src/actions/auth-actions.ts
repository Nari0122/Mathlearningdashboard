"use server";

export async function loginAction(id: string, pw: string) {
    const adminId = process.env.ADMIN_LOGIN_ID || "admin";
    const adminPw = process.env.ADMIN_LOGIN_PASSWORD || "admin";

    if (id === adminId && pw === adminPw) {
        return { success: true, role: "admin", redirectUrl: "/admin/students" };
    }

    // 학생 로그인은 카카오 등 소셜 로그인만 지원 (students에 password 미저장)
    return { success: false, message: "아이디 또는 비밀번호가 올바르지 않습니다." };
}
