"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AUTH_SIGNUP_ROLE_COOKIE } from "@/lib/auth-constants";

const ROLE = ["STUDENT", "PARENT"] as const;
type Role = (typeof ROLE)[number];

/** 계정 연동 버튼 설정 (NextAuth provider id와 UI 라벨) */
const SIGNUP_PROVIDERS = [
    { id: "kakao", label: "카카오로 계속하기", className: "bg-[#FEE500] hover:bg-[#FDD835] text-[#191919]" },
] as const;

function setSignupRoleCookie(role: string) {
    document.cookie = `${AUTH_SIGNUP_ROLE_COOKIE}=${role}; path=/; max-age=600; SameSite=Lax`;
}

function SignupAuthContent() {
    const searchParams = useSearchParams();
    const roleParam = searchParams?.get("role") ?? null;
    const role: Role = ROLE.includes(roleParam as Role) ? (roleParam as Role) : "STUDENT";
    const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

    useEffect(() => {
        setSignupRoleCookie(role);
    }, [role]);

    const callbackUrl = role === "PARENT" ? "/signup/complete-parent" : "/signup/complete-student";

    const handleProviderSignIn = useCallback(
        (providerId: string) => {
            setSignupRoleCookie(role);
            setLoadingProvider(providerId);
            signIn(providerId, { callbackUrl });
        },
        [role, callbackUrl]
    );

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl shadow-lg mb-4 border border-gray-200">
                        <div className="w-16 h-16 bg-gray-900 rounded-xl flex items-center justify-center">
                            <span className="text-3xl font-bold text-white">M</span>
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">소셜 로그인</h1>
                    <p className="text-gray-600 mt-1">
                        {role === "PARENT" ? "학부모" : "학생"} 계정으로 가입합니다
                    </p>
                </div>

                <Card className="w-full">
                    <CardHeader>
                        <CardTitle className="text-lg">계정 연동</CardTitle>
                        <CardDescription>아래 서비스 중 하나로 계속하세요.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {SIGNUP_PROVIDERS.map(({ id, label, className }) => (
                            <Button
                                key={id}
                                type="button"
                                variant={className ? undefined : "outline"}
                                className={`w-full h-11 ${className ?? ""}`}
                                disabled={!!loadingProvider}
                                onClick={() => handleProviderSignIn(id)}
                            >
                                {loadingProvider === id ? "연결 중..." : label}
                            </Button>
                        ))}
                    </CardContent>
                </Card>

                <p className="text-center mt-4">
                    <Link href="/signup" className="text-sm text-gray-500 hover:underline">
                        이전으로
                    </Link>
                </p>
            </div>
        </div>
    );
}

export default function SignupAuthPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                    <p className="text-gray-600">로딩 중...</p>
                </div>
            }
        >
            <SignupAuthContent />
        </Suspense>
    );
}
