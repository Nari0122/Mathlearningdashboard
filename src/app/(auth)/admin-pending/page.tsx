import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { getAuthOptions, getHomePathByRole } from "@/lib/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/** Admin 가입 직후 승인 대기 상태. Super Admin이 승인해야 이용 가능. */
export default async function AdminPendingPage() {
    const session = await getServerSession(getAuthOptions(undefined));
    const role = (session?.user as { role?: string })?.role;
    const status = (session?.user as { status?: string })?.status;

    if (!session) redirect("/login");
    const isAdminPending = (role === "ADMIN" || role === "SUPER_ADMIN") && status === "PENDING";
    if (!isAdminPending) {
        redirect(getHomePathByRole(role ?? "", status));
    }

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-xl text-center">승인 대기 중</CardTitle>
                    <CardDescription className="text-center">
                        관리자 계정이 등록되었습니다. Super Admin의 승인 후 서비스를 이용할 수 있습니다.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-gray-600 text-center">
                        승인이 완료되면 로그인 시 관리자 대시보드로 자동 이동합니다. 문의는 Super Admin에게 연락해 주세요.
                    </p>
                    <div className="flex justify-center">
                        <Button asChild variant="outline">
                            <Link href="/login">로그인 화면으로</Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
