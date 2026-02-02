import type { Metadata } from "next";
import { StudentHeader } from "@/components/shared/StudentHeader";
import { db } from "@/lib/db";

export const metadata: Metadata = {
    title: "Student Dashboard | MATHCLINIC",
    description: "Math Learning Dashboard for Students",
};

export default async function DashboardLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    // Fetch student user (using mock ID 2 logic as per other pages, or first student)
    const studentUser = await db.user.findFirst({ where: { role: 'student' } });
    const studentName = studentUser ? studentUser.name : "학생";

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <StudentHeader studentName={studentName} />
            <main className="flex-1 w-full">
                {children}
            </main>
        </div>
    );
}
