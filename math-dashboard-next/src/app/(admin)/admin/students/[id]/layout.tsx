import { getStudentDetailByDocId } from "@/actions/student-actions";
import StudentDetailLayoutClient from "@/components/features/admin/StudentDetailLayoutClient";
import { notFound } from "next/navigation";

/** 매 요청마다 Firestore에서 최신 데이터 조회 (캐시로 인한 빈 목록 방지) */
export const dynamic = "force-dynamic";

export default async function StudentDetailLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ id: string }>;
}) {
    const { id: docId } = await params;
    if (!docId) notFound();

    const student = await getStudentDetailByDocId(docId);

    if (!student) {
        notFound();
    }

    return (
        <StudentDetailLayoutClient
            studentDocId={docId}
            studentName={student.name}
            student={student}
        >
            {children}
        </StudentDetailLayoutClient>
    );
}
