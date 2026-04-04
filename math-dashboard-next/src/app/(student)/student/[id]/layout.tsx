import { getServerSession } from "next-auth";
import { getStudentDetailByDocId } from "@/actions/student-actions";
import { notFound, redirect } from "next/navigation";
import { getAuthOptions } from "@/lib/auth";

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

    // 본인 데이터만 접근 허용 — 다른 학생의 URL로 접근 시 본인 페이지로 리다이렉트
    if (uid !== docId) {
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
    return <>{children}</>;
}
