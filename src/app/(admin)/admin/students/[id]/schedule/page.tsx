import { getStudentDetailByDocId } from "@/actions/student-actions";
import { notFound } from "next/navigation";
import AdminScheduleClient from "@/components/features/admin/AdminScheduleClient";

export default async function AdminSchedulePage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id: docId } = await params;
    if (!docId) notFound();

    const student = await getStudentDetailByDocId(docId);
    if (!student) notFound();

    const { learningService } = await import("@/services/learningService");
    const schedules = await learningService.getSchedules(docId);

    return (
        <AdminScheduleClient schedules={schedules} studentDocId={docId} />
    );
}
