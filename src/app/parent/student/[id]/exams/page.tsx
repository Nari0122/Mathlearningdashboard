import { getStudentDetail } from "@/actions/student-actions";
import { notFound } from "next/navigation";
import StudentExamsClient from "@/components/features/student/StudentExamsClient";
import { learningService } from "@/services/learningService";

export default async function ParentStudentExamsPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const studentId = parseInt(id);
    if (isNaN(studentId)) {
        notFound();
    }

    const student = await getStudentDetail(studentId);

    if (!student) {
        notFound();
    }

    const exams = await learningService.getExams(studentId);

    return <StudentExamsClient exams={exams} studentId={studentId} />;
}
