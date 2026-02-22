"use client";

import { useEffect } from "react";
import { AUTH_ADMIN_LOGIN_FLOW_COOKIE, AUTH_ADMIN_SIGNUP_INTENT_COOKIE } from "@/lib/auth-constants";

/** /admin-login/callback 도착 시 쿠키 제거 (다음 카카오 로그인 시 일반 플로우 유지) */
export function ClearAdminLoginCookie() {
    useEffect(() => {
        document.cookie = `${AUTH_ADMIN_LOGIN_FLOW_COOKIE}=; path=/; max-age=0`;
        document.cookie = `${AUTH_ADMIN_SIGNUP_INTENT_COOKIE}=; path=/; max-age=0`;
    }, []);
    return null;
}
