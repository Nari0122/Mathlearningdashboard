import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth";
import { studentService } from "@/services/studentService";
import { getIncorrectNotes } from "@/actions/note-actions";
import { getUnits } from "@/actions/unit-actions";
import IncorrectNotesClient from "@/components/features/learning/IncorrectNotesClient";

export const dynamic = "force-dynamic";

export default async function IncorrectNotesPage() {
    const session = await getServerSession(getAuthOptions(undefined));
    const uid = (session?.user as { sub?: string })?.sub ?? (session?.user as { id?: string })?.id;
    if (!session || !uid) redirect("/login");

    const studentUser = await studentService.getStudentByUid(uid);
    if (!studentUser) redirect("/signup");

    const notes = await getIncorrectNotes(studentUser.id as number);
    const units = await getUnits(uid);
    return <IncorrectNotesClient notes={notes} units={units} userId={studentUser.id as number} />;
}
