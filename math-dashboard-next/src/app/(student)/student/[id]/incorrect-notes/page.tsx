import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { getAuthOptions } from "@/lib/auth";
import { learningService } from "@/services/learningService";
import StudentIncorrectNotesClient from "@/components/features/student/StudentIncorrectNotesClient";

export default async function StudentIncorrectNotesPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const session = await getServerSession(getAuthOptions(undefined));
    const uid = (session?.user as { sub?: string })?.sub ?? (session?.user as { id?: string })?.id;
    const { id } = await params;
    const studentDocId = id || uid;
    if (!studentDocId) notFound();

    const notes = await learningService.getIncorrectNotes(studentDocId);
    const units = await learningService.getUnits(studentDocId);

    return <StudentIncorrectNotesClient studentDocId={studentDocId} notes={notes} units={units} />;
}
