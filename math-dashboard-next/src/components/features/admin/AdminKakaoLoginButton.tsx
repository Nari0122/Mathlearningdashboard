"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { AUTH_ADMIN_LOGIN_FLOW_COOKIE, AUTH_ADMIN_SIGNUP_INTENT_COOKIE } from "@/lib/auth-constants";

/** /admin-login 전용: 쿠키 설정 후 카카오 로그인 → /admin-login/callback으로 이동 */
export function AdminKakaoLoginButton({ intent }: { intent?: "login" | "signup" } = {}) {
    const handleKakao = () => {
        document.cookie = `${AUTH_ADMIN_LOGIN_FLOW_COOKIE}=1; path=/; max-age=300`;
        if (intent === "signup") {
            document.cookie = `${AUTH_ADMIN_SIGNUP_INTENT_COOKIE}=1; path=/; max-age=300`;
        }
        const callbackUrl = intent === "signup" ? "/admin-login/callback?intent=signup" : "/admin-login/callback";
        signIn("kakao", { callbackUrl });
    };

    const label = intent === "signup" ? "카카오로 회원가입하기" : "카카오로 로그인하기";

    return (
        <Button
            type="button"
            onClick={handleKakao}
            className="w-full h-12 bg-[#FEE500] hover:bg-[#FDD835] text-[#191919] font-medium"
        >
            {label}
        </Button>
    );
}
