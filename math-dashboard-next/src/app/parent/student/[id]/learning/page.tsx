import { notFound } from "next/navigation";
import { learningService } from "@/services/learningService";
import StudentLearningClient from "@/components/features/student/StudentLearningClient";

export default async function ParentStudentLearningPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id: docId } = await params;
    if (!docId) notFound();

    const units = await learningService.getUnits(docId);

    const mappedUnits = units.map((u: any) => ({
        ...u,
        errors: {
            C: u.errorC || 0,
            M: u.errorM || 0,
            R: u.errorR || 0,
            S: u.errorS || 0,
        }
    }));

    return <StudentLearningClient units={mappedUnits} studentDocId={docId} />;
}
