"use client";

import Link from "next/link";
import { BookOpen, UserCircle, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SignupPage() {
    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center p-4">
            <div className="w-full max-w-md flex-1 flex flex-col pt-4">
                <Link href="/login" className="self-start">
                    <Button variant="ghost" size="sm" className="gap-2 text-gray-600 hover:text-gray-900">
                        <ArrowLeft className="w-4 h-4" />
                        뒤로가기
                    </Button>
                </Link>
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl shadow-lg mb-4 border border-gray-200">
                        <div className="w-16 h-16 bg-gray-900 rounded-xl flex items-center justify-center">
                            <span className="text-3xl font-bold text-white">M</span>
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">강나리 MATH LAB</h1>
                    <p className="text-gray-600">회원가입 / 로그인</p>
                </div>

                <div className="space-y-4">
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
                </div>

                <p className="mt-6 text-center text-sm text-gray-600">
                    © 2026 강나리 MATH LAB
                </p>
            </div>
        </div>
    );
}
