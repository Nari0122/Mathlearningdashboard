import { getStudentDetail } from "@/actions/student-actions";
import AdminStudentDashboardClient from "@/components/features/admin/AdminStudentDashboardClient";
import { notFound } from "next/navigation";
import { Unit } from "@/types";

export default async function AdminStudentDashboardPage({
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
        <AdminStudentDashboardClient initialUnits={mappedUnits} />
    );
}
