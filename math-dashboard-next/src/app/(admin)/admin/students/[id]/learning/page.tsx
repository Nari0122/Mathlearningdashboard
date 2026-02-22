import AdminLearningClient from "@/components/features/admin/AdminLearningClient";
import { notFound } from "next/navigation";
import { Unit } from "@/types";

export default async function AdminLearningPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id: docId } = await params;
    if (!docId) notFound();

    const { learningService } = await import("@/services/learningService");
    const unitsData = await learningService.getUnits(docId);

    const mappedUnits: Unit[] = (unitsData || []).map((u: any) => ({
        id: u.id,
        name: u.name,
        grade: u.grade || "고1",
        subject: u.subject || "수학",
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
        <AdminLearningClient initialUnits={mappedUnits} studentDocId={docId} />
    );
}
