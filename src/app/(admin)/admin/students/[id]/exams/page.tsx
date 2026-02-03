import { getStudentDetail } from "@/actions/student-actions";
import { notFound } from "next/navigation";
import AdminExamsClient from "@/components/features/admin/AdminExamsClient";

export default async function AdminExamsPage({
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

    // Use services
    const { learningService } = await import("@/services/learningService");
    const exams = await learningService.getExams(studentId);

    return (
        <AdminExamsClient exams={exams} studentId={studentId} />
    );
}
