"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { registerParent, checkExistingUserByUid } from "@/actions/signup-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/**
 * 학부모 소셜 로그인 후: 추가 정보 없이 바로 Firestore parents에 등록 후 학부모 대시보드로 이동
 * 이미 학생/관리자로 가입된 uid면 "이미 가입된 유저입니다" 표시 후 해당 화면으로 이동
 */
export default function CompleteParentPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [alreadyRegistered, setAlreadyRegistered] = useState<{ message: string; redirect: string } | null>(null);

    useEffect(() => {
        if (status !== "authenticated" || !session?.user) return;

        const sub = (session.user as { sub?: string }).sub ?? (session.user as { id?: string }).id;
        if (!sub) {
            setError("로그인 정보를 찾을 수 없습니다.");
            return;
        }

        (async () => {
            const existing = await checkExistingUserByUid(sub);
            if (existing.kind !== null) {
                setAlreadyRegistered({ message: existing.message, redirect: existing.redirect });
                return;
            }
            const result = await registerParent({
                uid: sub,
                name: session.user?.name ?? null,
                image: session.user?.image ?? null,
            });
            if (result.success) {
                router.replace(result.redirect);
                return;
            }
            setError(result.message ?? "등록에 실패했습니다.");
        })();
    }, [session, status, router]);

    if (status === "loading") {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
                <p className="text-gray-600">등록 중...</p>
            </div>
        );
    }

    if (status !== "authenticated" || !session?.user) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle>로그인이 필요합니다</CardTitle>
                        <p className="text-sm text-gray-600">소셜 로그인 후 이 페이지로 이동해 주세요.</p>
                    </CardHeader>
                    <CardContent>
                        <Link
                            href="/signup/auth?role=PARENT"
                            className="inline-flex items-center justify-center rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                        >
                            학부모 로그인
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (alreadyRegistered) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle>이미 가입된 계정입니다</CardTitle>
                        <p className="text-sm text-gray-600">{alreadyRegistered.message}</p>
                    </CardHeader>
                    <CardContent>
                        <Button asChild className="w-full">
                            <Link href={alreadyRegistered.redirect}>로그인 페이지로 이동</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle>오류</CardTitle>
                        <p className="text-sm text-red-600">{error}</p>
                    </CardHeader>
                    <CardContent>
                        <Link
                            href="/signup"
                            className="inline-flex items-center justify-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            회원가입 선택으로
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <p className="text-gray-600">등록 중...</p>
        </div>
    );
}
