import { redirect } from "next/navigation";

/** 학부모 회원가입 → 소셜 로그인 페이지로 리다이렉트 */
export default function ParentSignupPage() {
    redirect("/signup/auth?role=PARENT");
}
