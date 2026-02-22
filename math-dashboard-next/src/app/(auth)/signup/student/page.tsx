import { redirect } from "next/navigation";

/** 학생 회원가입 → 소셜 로그인 페이지로 리다이렉트 */
export default function StudentSignupPage() {
    redirect("/signup/auth?role=STUDENT");
}
