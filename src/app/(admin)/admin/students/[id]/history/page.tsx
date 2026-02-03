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

    // Direct fetch for better real-time updates and decoupling from "student" object
    const { learningService } = await import("@/services/learningService");
    const records = await learningService.getLearningRecords(studentId);

    return (
        <AdminHistoryClient records={records} studentId={studentId} />
    );
}
