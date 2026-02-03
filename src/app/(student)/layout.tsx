import type { Metadata } from "next";
import { StudentSidebar } from "@/components/shared/StudentSidebar";

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
            <StudentSidebar />
            <div className="flex-1 overflow-y-auto">
                <main className="p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
