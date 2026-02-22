import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth";
import { studentService } from "@/services/studentService";
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
    let studentName: string | undefined;
    if (uid) {
        const student = await studentService.getStudentByUid(uid);
        if (student && (student as { approvalStatus?: string }).approvalStatus === "PENDING") {
            redirect("/pending-approval");
        }
        if (student?.name) studentName = (student.name as string).trim() || undefined;
    }

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Desktop Sidebar */}
            <div className="hidden md:block h-full">
                <StudentSidebar userName={studentName} />
            </div>

            <div className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Mobile Header: iOS Safe Area 상단 반영 */}
                <header className="md:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between shrink-0">
                    <div className="font-bold text-lg">MATHCLINIC Student</div>
                    <MobileSidebarWrapper>
                        <StudentSidebar userName={studentName} className="w-full border-none shadow-none" />
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
