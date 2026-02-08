import { getStudentDetailByDocId } from "@/actions/student-actions";
import StudentDetailLayoutClient from "@/components/features/admin/StudentDetailLayoutClient";
import { notFound } from "next/navigation";

export default async function StudentDetailLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ id: string }>;
}) {
    const { id: docId } = await params;
    if (!docId) notFound();

    const student = await getStudentDetailByDocId(docId);

    if (!student) {
        notFound();
    }

    return (
        <StudentDetailLayoutClient
            studentDocId={docId}
            studentName={student.name}
            student={student}
        >
            {children}
        </StudentDetailLayoutClient>
    );
}
