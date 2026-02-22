"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

const ERROR_MESSAGES: Record<string, string> = {
    OAuthSignin: "카카오 로그인 시작에 실패했습니다. (KAKAO_CLIENT_ID, Redirect URI 확인)",
    OAuthCallback: "카카오 로그인 처리에 실패했습니다. Redirect URI가 카카오 디벨로퍼스에 등록되어 있는지 확인해주세요.",
    OAuthCreateAccount: "계정 생성에 실패했습니다.",
    Callback: "로그인 처리 중 오류가 발생했습니다.",
    Configuration: "서버 설정에 문제가 있습니다. (NEXTAUTH_SECRET, NEXTAUTH_URL 확인)",
    AccessDenied: "로그인 접근이 거부되었습니다.",
    account_inactive: "비활성화된 계정입니다. 문의는 선생님 또는 고객센터로 연락해 주세요.",
    Default: "로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
};

function LoginContent() {
    const searchParams = useSearchParams();
    const errorCode = searchParams.get("error") || undefined;
    const errorMessage = errorCode
        ? (ERROR_MESSAGES[errorCode] ?? `${ERROR_MESSAGES.Default} (코드: ${errorCode})`)
        : null;

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl shadow-lg mb-4 border border-gray-200">
                        <div className="w-16 h-16 bg-gray-900 rounded-xl flex items-center justify-center">
                            <span className="text-3xl font-bold text-white">M</span>
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">강나리 MATH LAB</h1>
                    <p className="text-gray-600">수학 학습 관리 시스템</p>
                </div>

                <Card className="w-full">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold text-center">로그인</CardTitle>
                        <CardDescription className="text-center">
                            소셜 로그인 또는 회원가입을 진행해 주세요.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {errorMessage && (
                            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
                                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                <span>{errorMessage}</span>
                            </div>
                        )}
                        <Button
                            type="button"
                            className="w-full h-12 bg-[#FEE500] hover:bg-[#FDD835] text-[#191919] font-medium"
                            onClick={() => signIn("kakao", { callbackUrl: "/api/auth/success" })}
                        >
                            카카오로 로그인하기
                        </Button>
                        <Button asChild variant="outline" className="w-full h-12 font-medium">
                            <Link href="/signup">회원가입</Link>
                        </Button>
                    </CardContent>
                    <CardFooter className="justify-center text-sm text-gray-600">
                        © 2026 강나리 MATH LAB
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-gray-100 flex items-center justify-center">로딩 중...</div>}>
            <LoginContent />
        </Suspense>
    );
}
