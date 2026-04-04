import { getServerSession } from "next-auth";
import { getStudentDetailByDocId } from "@/actions/student-actions";
import { notFound, redirect } from "next/navigation";
import { getAuthOptions } from "@/lib/auth";
import { userService } from "@/services/userService";
import StudentSectionTabsClient from "@/components/features/student/StudentSectionTabsClient";

export default async function StudentIdLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ id: string }>;
}) {
    const session = await getServerSession(getAuthOptions(undefined));
    const uid = (session?.user as { sub?: string })?.sub ?? (session?.user as { id?: string })?.id;
    const { id: docId } = await params;

    if (!session || !uid) redirect("/login");

    // 관리자는 모든 학생 페이지 미리보기 가능
    const admin = await userService.getAdmin(uid);
    const adminRole = admin && (admin as { role?: string }).role;
    const isAdmin = adminRole === "ADMIN" || adminRole === "SUPER_ADMIN";

    // 학생은 본인 데이터만 접근 허용
    if (!isAdmin && uid !== docId) {
        redirect(`/student/${uid}`);
    }

    const student = await getStudentDetailByDocId(docId);
    if (!student) notFound();

    const accountStatus = (student as { accountStatus?: string }).accountStatus ?? "ACTIVE";
    if (accountStatus === "INACTIVE") {
        redirect("/login?error=account_inactive");
    }
    if ((student as { approvalStatus?: string }).approvalStatus === "PENDING") {
        redirect("/pending-approval");
    }
    return <StudentSectionTabsClient studentDocId={docId}>{children}</StudentSectionTabsClient>;
}
