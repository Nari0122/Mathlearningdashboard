import { getStudentDetail } from "@/actions/student-actions";
import { notFound, redirect } from "next/navigation";

/** 학생 [id] 하위 모든 라우트에서 PENDING이면 승인 대기 페이지로 리다이렉트 */
export default async function StudentIdLayout({
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
    if ((student as { approvalStatus?: string }).approvalStatus === "PENDING") {
        redirect("/pending-approval");
    }
    return <>{children}</>;
}
