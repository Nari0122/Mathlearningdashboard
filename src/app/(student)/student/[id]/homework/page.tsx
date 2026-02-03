import { notFound } from "next/navigation";
import { learningService } from "@/services/learningService";
import StudentHomeworkClient from "@/components/features/student/StudentHomeworkClient";

export default async function StudentHomeworkPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const studentId = parseInt(id);
    if (isNaN(studentId)) {
        notFound();
    }

    const assignments = await learningService.getAssignments(studentId);

    return <StudentHomeworkClient assignments={assignments} studentId={studentId} />;
}
