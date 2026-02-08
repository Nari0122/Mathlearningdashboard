import { getStudentDetailByDocId } from "@/actions/student-actions";
import StudentDashboardClient from "@/components/features/student/StudentDashboardClient";
import { notFound } from "next/navigation";
import { studentService } from "@/services/studentService";
import { learningService } from "@/services/learningService";

export default async function ParentStudentDashboardPage({
    params,
}: {
    params: Promise<{ uid: string; id: string }>;
}) {
    const { uid, id: docId } = await params;
    if (!docId) notFound();

    const student = await getStudentDetailByDocId(docId);
    if (!student) notFound();

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
                basePath={`/parent/${uid}/student`}
            />
        </div>
    );
}
