import { getStudentDetail } from "@/actions/student-actions";
import { notFound } from "next/navigation";
import AdminHomeworkClient from "@/components/features/admin/AdminHomeworkClient";

export default async function AdminHomeworkPage({
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

    const homeworks = student.homeworks || [];

    return (
        <AdminHomeworkClient homeworks={homeworks} studentId={studentId} />
    );
}
