"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Lock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
    const router = useRouter();
    const [loginId, setLoginId] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        // Call server action for real auth
        try {
            // Import dynamically or use standard import if "use server" action
            // Since it's a client component, we import the server action
            const { loginAction } = await import("@/actions/auth-actions");
            const result = await loginAction(loginId, password);

            if (result.success && result.redirectUrl) {
                router.push(result.redirectUrl);
            } else {
                setIsLoading(false);
                setError(result.message || "로그인에 실패했습니다.");
            }
        } catch (err) {
            console.error(err);
            setIsLoading(false);
            setError("서버 연결 중 오류가 발생했습니다.");
        }
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
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">MATHCLINIC LAB</h1>
                    <p className="text-gray-600">수학 학습 관리 시스템</p>
                </div>

                <Card className="w-full">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold text-center">로그인</CardTitle>
                        <CardDescription className="text-center">
                            아이디와 비밀번호를 입력해 주세요
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-3">
                                    <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-red-700">{error}</p>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="loginId">아이디</Label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                                        <User size={20} />
                                    </div>
                                    <Input
                                        id="loginId"
                                        value={loginId}
                                        onChange={(e) => setLoginId(e.target.value)}
                                        className="pl-10"
                                        placeholder="아이디"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">비밀번호</Label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                                        <Lock size={20} />
                                    </div>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="pl-10"
                                        placeholder="비밀번호"
                                        required
                                    />
                                </div>
                            </div>

                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? "로그인 중..." : "로그인"}
                            </Button>
                        </form>
                    </CardContent>
                    <CardFooter className="justify-center text-sm text-gray-600">
                        © 2026 MATHCLINIC LAB
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
