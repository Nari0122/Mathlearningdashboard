import { getStudentDetailByDocId } from "@/actions/student-actions";
import StudentDashboardClient from "@/components/features/student/StudentDashboardClient";
import { notFound } from "next/navigation";

export default async function ParentStudentDashboardPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id: docId } = await params;
    if (!docId) notFound();

    const student = await getStudentDetailByDocId(docId);
    if (!student) notFound();

    const { studentService } = await import("@/services/studentService");
    const { learningService } = await import("@/services/learningService");

    const [stats, assignments, records] = await Promise.all([
        studentService.getDashboardStatsByDocId(docId),
        learningService.getAssignments(docId),
        learningService.getLearningRecords(docId),
    ]);

    return (
        <div className="space-y-6">
            <StudentDashboardClient
                stats={stats}
                recentAssignments={assignments.slice(0, 5)}
                recentRecords={records.slice(0, 5)}
                basePath="/parent/student"
            />
        </div>
    );
}
