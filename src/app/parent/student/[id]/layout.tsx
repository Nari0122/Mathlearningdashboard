import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { getAuthOptions } from "@/lib/auth";
import { parentService } from "@/services/parentService";
import { getStudentDetail } from "@/actions/student-actions";
import { ReadOnlyProvider } from "@/contexts/ReadOnlyContext";
import ParentStudentLayoutClient from "@/components/features/parent/ParentStudentLayoutClient";

export default async function ParentStudentLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ id: string }>;
}) {
    const session = await getServerSession(getAuthOptions(undefined));
    const uid = (session?.user as { sub?: string })?.sub ?? (session?.user as { id?: string })?.id;

    if (!session || !uid) {
        redirect("/login");
    }

    const parent = await parentService.getParentByUid(uid);
    if (!parent) {
        redirect("/login");
    }

    const { id } = await params;
    const studentId = parseInt(id, 10);
    if (isNaN(studentId)) {
        notFound();
    }

    const studentIds = (parent.studentIds as number[] | undefined) ?? [];
    if (!studentIds.includes(studentId)) {
        notFound();
    }

    const student = await getStudentDetail(studentId);
    if (!student) {
        notFound();
    }

    return (
        <ReadOnlyProvider value={true}>
            <ParentStudentLayoutClient studentId={String(studentId)} studentName={student.name}>
                {children}
            </ParentStudentLayoutClient>
        </ReadOnlyProvider>
    );
}
