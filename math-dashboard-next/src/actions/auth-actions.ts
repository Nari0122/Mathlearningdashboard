"use server";

/** 관리자 로그인은 /admin-login에서 카카오로 진행해 주세요. (회원가입 페이지의 관리자 폼은 사용하지 않음) */
export async function loginAction(_id: string, _pw: string) {
    return { success: false, message: "관리자는 /admin-login 에서 카카오로 로그인해 주세요." };
}
