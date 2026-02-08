import { getStudentDetailByDocId } from "@/actions/student-actions";
import { notFound } from "next/navigation";
import StudentExamsClient from "@/components/features/student/StudentExamsClient";
import { learningService } from "@/services/learningService";

export default async function ParentStudentExamsPage({
    params,
}: {
    params: Promise<{ uid: string; id: string }>;
}) {
    const { id: docId } = await params;
    if (!docId) notFound();

    const student = await getStudentDetailByDocId(docId);
    if (!student) notFound();

    const exams = await learningService.getExams(docId);

    return <StudentExamsClient exams={exams} studentDocId={docId} />;
}
