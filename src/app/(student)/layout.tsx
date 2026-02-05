import type { Metadata } from "next";
import { StudentSidebar } from "@/components/shared/StudentSidebar";
import { MobileSidebarWrapper } from "@/components/shared/MobileSidebarWrapper";

export const metadata: Metadata = {
    title: "Student Dashboard | MATHCLINIC",
    description: "Math Learning Management System",
};

export default function StudentLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="flex h-screen bg-gray-50">
            {/* Desktop Sidebar */}
            <div className="hidden md:block h-full">
                <StudentSidebar />
            </div>

            <div className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Mobile Header */}
                <header className="md:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between shrink-0">
                    <div className="font-bold text-lg">MATHCLINIC Student</div>
                    <MobileSidebarWrapper>
                        <StudentSidebar className="w-full border-none shadow-none" />
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
