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
    const stats = await studentService.getDashboardStats(studentId);

    if (!student) {
        notFound();
    }

    // Map Prisma Units to Dashboard Units
    const mappedUnits: Unit[] = (student.units || []).map((u: any) => ({
        id: u.id,
        name: u.name,
        grade: u.grade || "고1",
        subject: u.subject || "",
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
            <StudentDashboardClient initialUnits={mappedUnits} stats={stats} />
        </div>
    );
}
