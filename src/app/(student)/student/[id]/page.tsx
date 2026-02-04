import { getStudentDetail } from "@/actions/student-actions";
import StudentDashboardClient from "@/components/features/student/StudentDashboardClient";
import { notFound } from "next/navigation";
import { Unit } from "@/types";

export default async function StudentDashboardPage({
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

    // Fetch dashboard stats
    const { studentService } = await import("@/services/studentService");
    const { learningService } = await import("@/services/learningService");

    const [stats, assignments, records] = await Promise.all([
        studentService.getDashboardStats(studentId),
        learningService.getAssignments(studentId),
        learningService.getLearningRecords(studentId)
    ]);

    if (!student) {
        notFound();
    }

    // Map Prisma Units to Dashboard Units
    const mappedUnits: Unit[] = (student.units || []).map((u: any) => ({
        id: u.id,
        name: u.name,
        schoolLevel: u.grade?.includes('중') ? '중등' : '고등',
        grade: u.grade || "고1",
        subject: u.subject || "",
        unitName: u.name,
        unitDetails: [],
        status: u.status as 'HIGH' | 'MID' | 'LOW',
        selectedDifficulty: u.selectedDifficulty,
        completionStatus: u.completionStatus as 'incomplete' | 'in-progress' | 'completed',
        errors: {
            C: u.errorC,
            M: u.errorM,
            R: u.errorR,
            S: u.errorS,
        },
    }));

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">반갑습니다, {student.name} 학생!</h1>
                <p className="text-sm text-muted-foreground">오늘도 열심히 공부해봅시다.</p>
            </div>
            <StudentDashboardClient
                initialUnits={mappedUnits}
                stats={stats}
                recentAssignments={assignments.slice(0, 5)}
                recentRecords={records.slice(0, 5)}
            />
        </div>
    );
}
