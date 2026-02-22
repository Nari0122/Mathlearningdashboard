import { getStudentDetailByDocId } from "@/actions/student-actions";
import { notFound } from "next/navigation";
import AdminHomeworkClient from "@/components/features/admin/AdminHomeworkClient";

export const dynamic = "force-dynamic";

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
    const [homeworks, schedules] = await Promise.all([
        learningService.getAssignments(docId),
        learningService.getSchedules(docId),
    ]);

    return (
        <AdminHomeworkClient homeworks={homeworks} schedules={schedules} studentDocId={docId} />
    );
}
