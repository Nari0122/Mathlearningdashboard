import { getStudentDetailByDocId } from "@/actions/student-actions";
import { notFound } from "next/navigation";
import AdminHomeworkClient from "@/components/features/admin/AdminHomeworkClient";

export default async function AdminHomeworkPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id: docId } = await params;
    if (!docId) notFound();

    const student = await getStudentDetailByDocId(docId);
    if (!student) notFound();

    const { learningService } = await import("@/services/learningService");
    const homeworks = await learningService.getAssignments(docId);

    return (
        <AdminHomeworkClient homeworks={homeworks} studentDocId={docId} />
    );
}
