import { getStudentDetailByDocId } from "@/actions/student-actions";
import { notFound } from "next/navigation";
import AdminExamsClient from "@/components/features/admin/AdminExamsClient";

export default async function AdminExamsPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id: docId } = await params;
    if (!docId) notFound();

    const student = await getStudentDetailByDocId(docId);
    if (!student) notFound();

    const { learningService } = await import("@/services/learningService");
    const exams = await learningService.getExams(docId);

    return (
        <AdminExamsClient exams={exams} studentDocId={docId} />
    );
}
