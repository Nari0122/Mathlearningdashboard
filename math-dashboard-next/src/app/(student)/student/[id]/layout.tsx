import { getStudentDetailByDocId } from "@/actions/student-actions";
import { notFound, redirect } from "next/navigation";

export default async function StudentIdLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ id: string }>;
}) {
    const { id: docId } = await params;
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
