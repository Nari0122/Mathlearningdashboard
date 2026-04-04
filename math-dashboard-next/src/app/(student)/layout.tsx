import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth";
import { studentService } from "@/services/studentService";
import { userService } from "@/services/userService";
import { StudentSidebar } from "@/components/shared/StudentSidebar";
import { MobileSidebarWrapper } from "@/components/shared/MobileSidebarWrapper";

export const metadata: Metadata = {
    title: "Student Dashboard | MATHCLINIC",
    description: "Math Learning Management System",
};

export default async function StudentLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const session = await getServerSession(getAuthOptions(undefined));
    const uid = (session?.user as { sub?: string })?.sub ?? (session?.user as { id?: string })?.id;
    if (!session || !uid) redirect("/login");

    // 관리자는 학생 페이지 미리보기 허용
    const admin = await userService.getAdmin(uid);
    const adminRole = admin && (admin as { role?: string }).role;
    const isAdmin = adminRole === "ADMIN" || adminRole === "SUPER_ADMIN";

    let studentName: string | undefined;

    if (!isAdmin) {
        const student = await studentService.getStudentByUid(uid);
        if (!student) redirect("/login");

        const accountStatus = (student as { accountStatus?: string }).accountStatus ?? "ACTIVE";
        if (accountStatus === "INACTIVE") {
            redirect("/login?error=account_inactive");
        }
        if ((student as { approvalStatus?: string }).approvalStatus === "PENDING") {
            redirect("/pending-approval");
        }
        studentName = student?.name ? (student.name as string).trim() || undefined : undefined;
    }

    return (
        <div className="flex h-screen bg-gray-50">
            {isAdmin && (
                <div className="fixed top-0 left-0 right-0 z-[100] bg-amber-500 text-white text-center text-xs py-1 font-medium">
                    관리자 미리보기 모드 — 학생에게 보이는 화면입니다
                </div>
            )}

            {/* Desktop Sidebar */}
            <div className={`hidden md:block h-full ${isAdmin ? "pt-7" : ""}`}>
                <StudentSidebar userName={isAdmin ? "미리보기" : studentName} />
            </div>

            <div className={`flex-1 flex flex-col h-full overflow-hidden ${isAdmin ? "pt-7" : ""}`}>
                {/* Mobile Header */}
                <header className="md:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between shrink-0">
                    <div className="font-bold text-lg">MATHCLINIC Student</div>
                    <MobileSidebarWrapper>
                        <StudentSidebar userName={isAdmin ? "미리보기" : studentName} className="w-full border-none shadow-none" />
                    </MobileSidebarWrapper>
                </header>

                <div className="flex-1 overflow-y-auto overflow-x-hidden">
                    <main className="p-4 md:p-8">
                        {children}
                    </main>
                </div>
            </div>
        </div>
    );
}
