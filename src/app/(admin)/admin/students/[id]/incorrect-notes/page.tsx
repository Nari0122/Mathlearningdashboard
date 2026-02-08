import { notFound } from "next/navigation";
import AdminIncorrectNotesClient from "@/components/features/admin/AdminIncorrectNotesClient";

export default async function AdminIncorrectNotesPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id: docId } = await params;
    if (!docId) notFound();

    const { learningService } = await import("@/services/learningService");
    const notes = await learningService.getIncorrectNotes(docId);

    return <AdminIncorrectNotesClient notes={notes} studentDocId={docId} />;
}
