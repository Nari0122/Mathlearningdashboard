import { getStudentDetail } from "@/actions/student-actions";
import { notFound } from "next/navigation";
import StudentHistoryClient from "@/components/features/student/StudentHistoryClient";

export default async function StudentLearningHistoryPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const studentId = parseInt(id);
    if (isNaN(studentId)) {
        notFound();
    }

    // Direct fetch for better real-time updates
    const { learningService } = await import("@/services/learningService");
    const records = await learningService.getLearningRecords(studentId);

    return (
        <StudentHistoryClient records={records} studentId={studentId} />
    );
}
