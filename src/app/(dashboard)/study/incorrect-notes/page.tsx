import { db } from "@/lib/db";
import { getIncorrectNotes } from "@/actions/note-actions";
import { getUnits } from "@/actions/unit-actions";
import IncorrectNotesClient from "@/components/features/learning/IncorrectNotesClient";

export const dynamic = 'force-dynamic';

export default async function IncorrectNotesPage() {
    const studentUser = await db.user.findFirst({ where: { role: 'student' } });
    if (!studentUser) return <div>Student not found</div>;

    const notes = await getIncorrectNotes(studentUser.id);
    const units = await getUnits(studentUser.id);

    return <IncorrectNotesClient notes={notes} units={units} userId={studentUser.id} />;
}
