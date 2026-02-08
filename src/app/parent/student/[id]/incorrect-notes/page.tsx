import { notFound } from "next/navigation";
import { learningService } from "@/services/learningService";
import StudentIncorrectNotesClient from "@/components/features/student/StudentIncorrectNotesClient";

export default async function ParentStudentIncorrectNotesPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id: docId } = await params;
    if (!docId) notFound();

    const notes = await learningService.getIncorrectNotes(docId);
    const units = await learningService.getUnits(docId);

    return <StudentIncorrectNotesClient studentDocId={docId} notes={notes} units={units} />;
}
