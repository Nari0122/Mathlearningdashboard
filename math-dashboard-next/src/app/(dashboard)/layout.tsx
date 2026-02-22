import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth";
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
    const session = await getServerSession(getAuthOptions(undefined));
    const uid = (session?.user as { sub?: string })?.sub ?? (session?.user as { id?: string })?.id;
    if (!session || !uid) redirect("/login");

    const studentUser = await studentService.getStudentByUid(uid);
    if (!studentUser) redirect("/signup");

    const studentName = (studentUser.name as string) || "학생";

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <StudentHeader studentName={studentName} />
            <main className="flex-1 w-full">
                {children}
            </main>
        </div>
    );
}
