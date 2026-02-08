import { getStudentDetailByDocId } from "@/actions/student-actions";
import AdminStudentDashboardClient from "@/components/features/admin/AdminStudentDashboardClient";
import { notFound } from "next/navigation";
import { Unit } from "@/types";

export default async function AdminStudentDashboardPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id: docId } = await params;
    if (!docId) notFound();

    const student = await getStudentDetailByDocId(docId);

    if (!student) {
        notFound();
    }

    const { studentService } = await import("@/services/studentService");
    const { learningService } = await import("@/services/learningService");

    const [stats, assignments, records] = await Promise.all([
        studentService.getDashboardStatsByDocId(docId),
        learningService.getAssignments(docId),
        learningService.getLearningRecords(docId)
    ]);

    const mappedUnits: Unit[] = (student.units || []).map((u: any) => ({
        id: u.id,
        name: u.name,
        grade: u.grade || "고1",
        subject: u.subject || "",
        status: u.status as 'HIGH' | 'MID' | 'LOW',
        selectedDifficulty: u.selectedDifficulty,
        completionStatus: u.completionStatus as 'incomplete' | 'in-progress' | 'completed',
        schoolLevel: u.schoolLevel || "고등",
        unitName: u.unitName || u.name,
        unitDetails: u.unitDetails || [],
        errors: {
            C: u.errorC,
            M: u.errorM,
            R: u.errorR,
            S: u.errorS,
        },
    }));

    return (
        <AdminStudentDashboardClient
            initialUnits={mappedUnits}
            stats={stats}
            recentAssignments={assignments.slice(0, 5)}
            recentRecords={records.slice(0, 5)}
            studentDocId={docId}
        />
    );
}
