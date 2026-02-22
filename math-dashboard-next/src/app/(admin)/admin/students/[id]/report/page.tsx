import { Unit } from "@/types";
import ReportClient from "@/components/features/admin/ReportClient";

export const dynamic = 'force-dynamic';

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: docId } = await params;
    if (!docId) return null;

    const { studentService } = await import("@/services/studentService");
    const { learningService } = await import("@/services/learningService");

    const student = await studentService.getStudentDetailByDocId(docId);
    const unitsData = await learningService.getUnits(docId);
    const learningRecords = await learningService.getLearningRecords(docId);

    // Map explicit types to avoid runtime errors
    const units: Unit[] = unitsData.map((u: any) => ({
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
            C: u.errorC || 0,
            M: u.errorM || 0,
            R: u.errorR || 0,
            S: u.errorS || 0,
        },
    }));

    return <ReportClient units={units} studentName={student?.name || "학생"} learningRecords={learningRecords as any[]} />;
}
