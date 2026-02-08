"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
    const handleKakaoLogin = () => {
        signIn("kakao", { callbackUrl: "/api/auth/success" });
    };

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
                        <Button
                            type="button"
                            onClick={handleKakaoLogin}
                            className="w-full h-12 bg-[#FEE500] hover:bg-[#FDD835] text-[#191919] font-medium"
                        >
                            카카오로 계속하기
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
