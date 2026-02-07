import { notFound } from "next/navigation";
import { learningService } from "@/services/learningService";
import StudentIncorrectNotesClient from "@/components/features/student/StudentIncorrectNotesClient";

export default async function ParentStudentIncorrectNotesPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const studentId = parseInt(id);
    if (isNaN(studentId)) {
        notFound();
    }

    const notes = await learningService.getIncorrectNotes(studentId);
    const units = await learningService.getUnits(studentId);

    return <StudentIncorrectNotesClient studentId={studentId} notes={notes} units={units} />;
}
