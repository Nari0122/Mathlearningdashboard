import { notFound } from "next/navigation";
import AdminIncorrectNotesClient from "@/components/features/admin/AdminIncorrectNotesClient";
import { learningService } from "@/services/learningService";

export default async function AdminIncorrectNotesPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id: docId } = await params;
    if (!docId) notFound();

    const [notes, units] = await Promise.all([
        learningService.getIncorrectNotes(docId),
        learningService.getUnits(docId),
    ]);

    return (
        <AdminIncorrectNotesClient
            notes={notes}
            units={units as { id: number; name?: string; unitName?: string; schoolLevel?: string; grade?: string; subject?: string }[]}
            studentDocId={docId}
        />
    );
}
