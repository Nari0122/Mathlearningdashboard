import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getAuthOptions, getHomePathByRole } from "@/lib/auth";
import { userService } from "@/services/userService";
import { checkExistingUserByUid } from "@/actions/signup-actions";
import { AdminCompleteForm } from "@/components/features/admin/AdminCompleteForm";
import { ClearAdminLoginCookie } from "@/components/features/admin/ClearAdminLoginCookie";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/**
 * /admin-login에서 카카오 로그인 후 도착.
 * 관리자 우선 조회: admins에 있으면 로그인/이미 가입 안내, students/parents만 있으면 /login, 없으면 추가정보 폼.
 */
export default async function AdminLoginCallbackPage({
    searchParams,
}: {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const session = await getServerSession(getAuthOptions(undefined));
    const uid = (session?.user as { sub?: string })?.sub ?? (session?.user as { id?: string })?.id;

    if (!session || !uid) {
        redirect("/admin-login?error=session_required");
    }

    const params = await searchParams;
    const intent = typeof params?.intent === "string" ? params.intent : undefined;

    // 1) 관리자 우선 조회 (학생/학부모에 같은 uid가 있어도 관리자로 로그인 허용)
    const adminDoc = await userService.getAdmin(uid);
    const role = adminDoc && (adminDoc as { role?: string }).role;
    const status = (adminDoc && (adminDoc as { status?: string }).status) ?? undefined;

    if (role === "ADMIN" || role === "SUPER_ADMIN") {
        if (intent === "signup") {
            return (
                <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
                    <ClearAdminLoginCookie />
                    <div className="w-full max-w-md">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">이미 가입된 관리자입니다</CardTitle>
                                <CardDescription>회원가입 대신 로그인을 진행해주세요.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button asChild className="w-full">
                                    <Link href="/admin-login">확인</Link>
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            );
        }
        redirect(getHomePathByRole(role, status));
    }

    // 2) 학생/학부모로만 가입된 경우 → admin-login에 에러 표시
    const existing = await checkExistingUserByUid(uid);
    if (existing.kind === "student" || existing.kind === "parent") {
        redirect("/admin-login?error=student_or_parent");
    }

    // 3) 아직 어느 역할로도 가입되지 않음 → 관리자 추가정보 폼 표시

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <ClearAdminLoginCookie />
            <div className="w-full max-w-md">
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">관리자 계정 신청</h1>
                    <p className="text-gray-600 text-sm mt-1">이름과 전화번호를 입력한 뒤 가입하기를 눌러 주세요.</p>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">추가 정보</CardTitle>
                        <CardDescription>가입 후 Super Admin 승인이 필요합니다.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <AdminCompleteForm uid={uid} />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
