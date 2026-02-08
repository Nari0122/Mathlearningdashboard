import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { AdminSidebar } from "@/components/shared/AdminSidebar";
import { MobileSidebarWrapper } from "@/components/shared/MobileSidebarWrapper";
import { getAuthOptions } from "@/lib/auth";
import { userService } from "@/services/userService";

export const metadata: Metadata = {
    title: "Admin Dashboard | MATHCLINIC",
    description: "Math Learning Management System",
};

/** Admin 영역은 항상 서버에서 세션·DB 검사 (캐시로 이전 세션 노출 방지) */
export const dynamic = "force-dynamic";

export default async function AdminLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const session = await getServerSession(getAuthOptions(undefined));
    const role = (session?.user as { role?: string })?.role;
    const status = (session?.user as { status?: string })?.status;
    if (!session) redirect("/login");
    if ((role === "ADMIN" || role === "SUPER_ADMIN") && status === "PENDING") redirect("/admin-pending");

    const uid = (session.user as { sub?: string })?.sub ?? (session.user as { id?: string })?.id;
    const uidStr = uid ? String(uid) : "";
    const admin = uidStr ? await userService.getAdmin(uidStr) : null;
    const adminRole = admin && (admin as { role?: string }).role;

    // Admin 영역 접근: DB에 해당 uid 문서가 있고 role이 ADMIN/SUPER_ADMIN일 때만 허용. 그 외는 로그인으로.
    if (!admin || (adminRole !== "ADMIN" && adminRole !== "SUPER_ADMIN")) {
        redirect("/login?callbackUrl=/admin/students&error=admin_not_found");
    }

    // 이름은 반드시 DB 값만 사용. 비어 있으면 "관리자" (세션/카카오 이름 사용 안 함)
    const adminName = (admin.name as string)?.trim() || "관리자";
    const isSuperAdminFromServer = adminRole === "SUPER_ADMIN";

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Desktop Sidebar */}
            <div className="hidden md:block h-full">
                <AdminSidebar userName={adminName} isSuperAdmin={isSuperAdminFromServer} />
            </div>

            <div className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Mobile Header */}
                <header className="md:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between shrink-0">
                    <div className="font-bold text-lg">MATHCLINIC Admin</div>
                    <MobileSidebarWrapper>
                        <AdminSidebar userName={adminName} isSuperAdmin={isSuperAdminFromServer} className="w-full border-none shadow-none" />
                    </MobileSidebarWrapper>
                </header>

                <div className="flex-1 overflow-y-auto">
                    <main className="p-4 md:p-8">
                        {children}
                    </main>
                </div>
            </div>
        </div>
    );
}
