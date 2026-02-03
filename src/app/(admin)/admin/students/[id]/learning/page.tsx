import { getStudentDetail } from "@/actions/student-actions";
import AdminLearningClient from "@/components/features/admin/AdminLearningClient";
import { notFound } from "next/navigation";
import { Unit } from "@/types";

export default async function AdminLearningPage({
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
    const unitsData = await learningService.getUnits(studentId);

    // Map to Dashboard Units
    const mappedUnits: Unit[] = (unitsData || []).map((u: any) => ({
        id: u.id,
        name: u.name,
        grade: u.grade || "고1",
        subject: u.subject || "수학",
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
        <AdminLearningClient initialUnits={mappedUnits} studentId={studentId} />
    );
}
