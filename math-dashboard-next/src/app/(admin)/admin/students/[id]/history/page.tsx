import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth";
import { userService } from "@/services/userService";
import AdminHistoryClient from "@/components/features/admin/AdminHistoryClient";

export default async function AdminLearningHistoryPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id: docId } = await params;
    if (!docId) notFound();

    const { learningService } = await import("@/services/learningService");
    const records = await learningService.getLearningRecords(docId);

    const session = await getServerSession(getAuthOptions(undefined));
    const uid = (session?.user as { sub?: string })?.sub ?? (session?.user as { id?: string })?.id;
    const uidStr = uid ? String(uid) : "";
    const admin = uidStr ? await userService.getAdmin(uidStr) : null;
    const adminName = (admin?.name as string)?.trim() || "관리자";

    return (
        <AdminHistoryClient records={records} studentDocId={docId} adminName={adminName} />
    );
}
