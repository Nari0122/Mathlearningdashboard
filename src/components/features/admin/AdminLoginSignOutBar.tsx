"use client";

import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

/** /admin-login 페이지: 이미 로그인된 경우 로그아웃 유도 (캐시만 지워도 세션 쿠키는 남아 있어 /admin 접근 가능한 문제 방지) */
export function AdminLoginSignOutBar() {
    const { data: session, status } = useSession();
    if (status !== "authenticated" || !session?.user) return null;

    const name = session.user.name ?? "로그인된 계정";
    return (
        <div className="w-full max-w-md mx-auto mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-900">
            <p className="font-medium mb-1">현재 &quot;{name}&quot;(으)로 로그인되어 있습니다.</p>
            <p className="text-amber-700 mb-2">
                관리자로 새로 로그인하려면 먼저 로그아웃하세요. (캐시/새로고침만으로는 세션이 지워지지 않습니다.)
            </p>
            <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-amber-300 text-amber-800 hover:bg-amber-100"
                onClick={() => signOut({ callbackUrl: "/admin-login" })}
            >
                <LogOut className="h-4 w-4 mr-2" />
                로그아웃
            </Button>
        </div>
    );
}
