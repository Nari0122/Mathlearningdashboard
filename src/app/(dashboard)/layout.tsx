import type { Metadata } from "next";
import { StudentHeader } from "@/components/shared/StudentHeader";
import { studentService } from "@/services/studentService";

export const metadata: Metadata = {
    title: "Student Dashboard | MATHCLINIC",
    description: "Math Learning Dashboard for Students",
};

export default async function DashboardLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    // Fetch student user from Firestore
    const studentUser = await studentService.getFirstStudent();
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
