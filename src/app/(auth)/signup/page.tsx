"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, BookOpen, UserCircle, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SignupPage() {
    const router = useRouter();
    const [adminId, setAdminId] = useState("");
    const [adminPassword, setAdminPassword] = useState("");
    const [adminError, setAdminError] = useState("");
    const [adminLoading, setAdminLoading] = useState(false);

    const handleAdminLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setAdminError("");
        setAdminLoading(true);
        try {
            const { loginAction } = await import("@/actions/auth-actions");
            const result = await loginAction(adminId, adminPassword);
            if (result.success && result.redirectUrl) {
                router.push(result.redirectUrl);
                return;
            }
            setAdminError(result.message || "로그인에 실패했습니다.");
        } catch {
            setAdminError("서버 연결 중 오류가 발생했습니다.");
        } finally {
            setAdminLoading(false);
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
                    <p className="text-gray-600">회원가입 / 로그인</p>
                </div>

                <div className="space-y-4">
                    {/* 학생이십니까? */}
                    <Card className="overflow-hidden transition-shadow hover:shadow-md">
                        <Link href="/signup/auth?role=STUDENT" className="block">
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                                        <BookOpen className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">학생이십니까?</CardTitle>
                                        <CardDescription>학생 회원가입</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <p className="text-sm text-gray-600">학생 계정으로 가입합니다.</p>
                            </CardContent>
                        </Link>
                    </Card>

                    {/* 학부모 입니까? */}
                    <Card className="overflow-hidden transition-shadow hover:shadow-md">
                        <Link href="/signup/auth?role=PARENT" className="block">
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                                        <UserCircle className="w-6 h-6 text-green-600" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">학부모 입니까?</CardTitle>
                                        <CardDescription>학부모 회원가입</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <p className="text-sm text-gray-600">학부모 계정으로 가입합니다.</p>
                            </CardContent>
                        </Link>
                    </Card>

                    {/* 관리자 페이지 로그인 */}
                    <Card className="overflow-hidden">
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-gray-200 flex items-center justify-center">
                                    <Shield className="w-6 h-6 text-gray-600" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg">관리자 페이지 로그인</CardTitle>
                                    <CardDescription>관리자 전용 로그인</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleAdminLogin} className="space-y-3">
                                {adminError && (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                                        <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
                                        <p className="text-sm text-red-700">{adminError}</p>
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <Label htmlFor="adminId">아이디</Label>
                                    <Input
                                        id="adminId"
                                        value={adminId}
                                        onChange={(e) => setAdminId(e.target.value)}
                                        placeholder="관리자 아이디"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="adminPassword">비밀번호</Label>
                                    <Input
                                        id="adminPassword"
                                        type="password"
                                        value={adminPassword}
                                        onChange={(e) => setAdminPassword(e.target.value)}
                                        placeholder="비밀번호"
                                        required
                                    />
                                </div>
                                <Button type="submit" className="w-full" disabled={adminLoading}>
                                    {adminLoading ? "로그인 중..." : "로그인"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                <p className="mt-6 text-center text-sm text-gray-600">
                    © 2026 MATHCLINIC LAB
                </p>
            </div>
        </div>
    );
}
