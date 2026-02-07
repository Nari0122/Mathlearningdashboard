import { notFound } from "next/navigation";
import { learningService } from "@/services/learningService";
import StudentHistoryClient from "@/components/features/student/StudentHistoryClient";

export default async function ParentStudentHistoryPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const studentId = parseInt(id);
    if (isNaN(studentId)) {
        notFound();
    }

    const records = await learningService.getLearningRecords(studentId);

    return <StudentHistoryClient records={records} studentId={studentId} />;
}
