import { notFound } from "next/navigation";
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

    return (
        <AdminHistoryClient records={records} studentDocId={docId} />
    );
}
