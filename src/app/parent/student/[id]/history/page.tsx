import { notFound } from "next/navigation";
import { learningService } from "@/services/learningService";
import StudentHistoryClient from "@/components/features/student/StudentHistoryClient";

export default async function ParentStudentHistoryPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id: docId } = await params;
    if (!docId) notFound();

    const records = await learningService.getLearningRecords(docId);

    return <StudentHistoryClient records={records} studentDocId={docId} />;
}
