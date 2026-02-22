import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck } from "lucide-react";

/**
 * /login에서 관리자 계정으로 카카오 로그인 시도 시 리다이렉트되는 페이지.
 * "관리자입니다. 관리자 페이지에서 로그인해주세요." 안내 후 /admin-login으로 이동.
 */
export default function AdminLoginRequiredPage() {
    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <div className="flex items-center gap-3 text-amber-800">
                        <ShieldCheck className="w-8 h-8 shrink-0 text-amber-600" />
                        <div>
                            <CardTitle className="text-lg">관리자입니다</CardTitle>
                            <CardDescription className="text-amber-700 mt-1">
                                관리자 페이지에서 로그인해주세요.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Button asChild className="w-full">
                        <Link href="/admin-login">확인</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
