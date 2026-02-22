import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { getAuthOptions } from "@/lib/auth";
import { parentService } from "@/services/parentService";
import { getStudentDetailByDocId } from "@/actions/student-actions";
import { ReadOnlyProvider } from "@/contexts/ReadOnlyContext";
import ParentStudentLayoutClient from "@/components/features/parent/ParentStudentLayoutClient";

export default async function ParentStudentLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ uid: string; id: string }>;
}) {
    const session = await getServerSession(getAuthOptions(undefined));
    const sessionUid = (session?.user as { sub?: string })?.sub ?? (session?.user as { id?: string })?.id;
    const { uid, id: docId } = await params;

    if (!session || !sessionUid || sessionUid !== uid) redirect("/login");

    const parent = await parentService.getParentByUid(uid);
    if (!parent) redirect("/login");

    if (!docId) notFound();

    const studentIds = (parent.studentIds as (string | number)[] | undefined) ?? [];
    const student = await getStudentDetailByDocId(docId);
    if (!student) notFound();

    const hasAccess =
        studentIds.includes(docId) ||
        (typeof student.id === "number" && studentIds.includes(student.id));
    if (!hasAccess) notFound();

    return (
        <ReadOnlyProvider value={true}>
            <ParentStudentLayoutClient parentUid={uid} studentDocId={docId} studentName={student.name}>
                {children}
            </ParentStudentLayoutClient>
        </ReadOnlyProvider>
    );
}
