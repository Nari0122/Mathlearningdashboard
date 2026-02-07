import { getStudentDetail } from "@/actions/student-actions";
import StudentDashboardClient from "@/components/features/student/StudentDashboardClient";
import { notFound } from "next/navigation";

export default async function ParentStudentDashboardPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const studentId = parseInt(id, 10);
    if (isNaN(studentId)) {
        notFound();
    }

    const student = await getStudentDetail(studentId);
    const { studentService } = await import("@/services/studentService");
    const { learningService } = await import("@/services/learningService");

    const [stats, assignments, records] = await Promise.all([
        studentService.getDashboardStats(studentId),
        learningService.getAssignments(studentId),
        learningService.getLearningRecords(studentId),
    ]);

    if (!student) {
        notFound();
    }

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
