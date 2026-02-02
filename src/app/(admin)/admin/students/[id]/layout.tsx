import { getStudentDetail } from "@/actions/student-actions";
import StudentDetailLayoutClient from "@/components/features/admin/StudentDetailLayoutClient";
import { notFound } from "next/navigation";

export default async function StudentDetailLayout({
    children,
    params,
}: {
    children: React.ReactNode;
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

    return (
        <StudentDetailLayoutClient
            studentId={id}
            studentName={student.name}
            student={student}
        >
            {children}
        </StudentDetailLayoutClient>
    );
}
