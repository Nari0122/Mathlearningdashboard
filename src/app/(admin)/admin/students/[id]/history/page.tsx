import { getStudentDetail } from "@/actions/student-actions";
import { notFound } from "next/navigation";
import AdminHistoryClient from "@/components/features/admin/AdminHistoryClient";

export default async function AdminLearningHistoryPage({
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

    const records = student.learningRecords || [];

    return (
        <AdminHistoryClient records={records} studentId={studentId} />
    );
}
