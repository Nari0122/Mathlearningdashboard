import { getServerSession } from "next-auth";
import Link from "next/link";
import { getAuthOptions } from "@/lib/auth";
import { userService } from "@/services/userService";
import { AdminKakaoLoginButton } from "@/components/features/admin/AdminKakaoLoginButton";
import { AdminLoginErrorPopup } from "@/components/features/admin/AdminLoginErrorPopup";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

/**
 * 비공개 관리자 전용 URL. 카카오로 로그인/회원가입 후 Firestore admins 컬렉션에 문서 추가 (문서 ID = 카카오 uid).
 * Super Admin은 Firebase 콘솔에서 해당 계정의 role을 SUPER_ADMIN으로 수동 변경하면 됨.
 *
 * 학생/학부모로 이미 로그인된 경우: 관리자 로그인 폼 대신 접근 불가 안내 표시.
 * 로그인 실패 시: error 파라미터로 원인 팝업 표시.
 */
export default async function AdminLoginPage({
    searchParams,
}: {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const params = await searchParams;
    const error = typeof params?.error === "string" ? params.error : undefined;
    const session = await getServerSession(getAuthOptions(undefined));
    const uid = session?.user ? String((session.user as { sub?: string }).sub ?? (session.user as { id?: string }).id ?? "") : "";
    const admin = uid ? await userService.getAdmin(uid) : null;
    const adminRole = admin && (admin as { role?: string }).role;
    const isAdmin = adminRole === "ADMIN" || adminRole === "SUPER_ADMIN";

    // 세션 O, 관리자 X → 학생/학부모로 로그인된 상태
    if (session && !isAdmin) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
                <AdminLoginErrorPopup error={error} />
                <div className="w-full max-w-md">
                    <Card className="border-amber-200 bg-amber-50/50">
                        <CardHeader>
                            <div className="flex items-center gap-3 text-amber-800">
                                <AlertCircle className="w-8 h-8 shrink-0" />
                                <div>
                                    <CardTitle className="text-lg">접근 불가</CardTitle>
                                    <CardDescription className="text-amber-700 mt-1">
                                        학생 및 부모 계정으로는 관리자 페이지에 접근할 수 없습니다.
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <p className="text-sm text-amber-800">
                                학생 및 부모 계정으로는 접근할 수 없습니다. 다시 시도해주세요.
                            </p>
                            <Button asChild variant="outline" className="w-full border-amber-300 text-amber-800 hover:bg-amber-100">
                                <Link href="/login">로그인 화면으로 돌아가기</Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <AdminLoginErrorPopup error={error} />
            <div className="w-full max-w-md space-y-6">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900">관리자</h1>
                    <p className="text-gray-600 text-sm mt-1">비공개 관리자 로그인 및 가입</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">카카오로 로그인하기</CardTitle>
                        <CardDescription>이미 관리자 계정이 있으면 로그인하세요.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <AdminKakaoLoginButton />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">카카오로 회원가입하기</CardTitle>
                        <CardDescription>
                            새로 관리자로 가입합니다. 카카오 로그인 후 이름·전화번호를 입력하면 Firestore에 등록됩니다. Super Admin 승인 후 이용 가능합니다.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <AdminKakaoLoginButton intent="signup" />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
