import { getStudentDetail } from "@/actions/student-actions";
import { notFound } from "next/navigation";
import AdminScheduleClient from "@/components/features/admin/AdminScheduleClient";

export default async function AdminSchedulePage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const studentId = parseInt(id);
    if (isNaN(studentId)) {
        notFound();
    }

    const student = await getStudentDetail(studentId);

    if (!student) {
        notFound();
    }

    const schedules = student.schedules || [];

    return (
        <AdminScheduleClient schedules={schedules} studentId={studentId} />
    );
}
