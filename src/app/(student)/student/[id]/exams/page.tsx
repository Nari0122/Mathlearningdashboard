import { getServerSession } from "next-auth";
import { getStudentDetailByDocId } from "@/actions/student-actions";
import { notFound } from "next/navigation";
import { getAuthOptions } from "@/lib/auth";
import StudentExamsClient from "@/components/features/student/StudentExamsClient";
import { learningService } from "@/services/learningService";

export default async function StudentExamsPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const session = await getServerSession(getAuthOptions(undefined));
    const uid = (session?.user as { sub?: string })?.sub ?? (session?.user as { id?: string })?.id;
    const { id } = await params;
    const studentDocId = id || uid;
    if (!studentDocId) notFound();

    const student = await getStudentDetailByDocId(studentDocId);
    if (!student) notFound();

    const exams = await learningService.getExams(studentDocId);

    return <StudentExamsClient exams={exams} studentDocId={studentDocId} />;
}
