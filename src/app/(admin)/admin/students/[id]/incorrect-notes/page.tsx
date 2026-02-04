import { notFound } from "next/navigation";
import AdminIncorrectNotesClient from "@/components/features/admin/AdminIncorrectNotesClient";

export default async function AdminIncorrectNotesPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const studentId = parseInt(id);
    if (isNaN(studentId)) {
        notFound();
    }

    // Use services
    const { learningService } = await import("@/services/learningService");
    const notes = await learningService.getIncorrectNotes(studentId);

    return <AdminIncorrectNotesClient notes={notes} studentId={studentId} />;
}
