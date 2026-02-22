import { notFound } from "next/navigation";
import { learningService } from "@/services/learningService";
import StudentHomeworkClient from "@/components/features/student/StudentHomeworkClient";

export default async function ParentStudentHomeworkPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id: docId } = await params;
    if (!docId) notFound();

    const assignments = await learningService.getAssignments(docId);

    return <StudentHomeworkClient assignments={assignments} studentDocId={docId} />;
}
