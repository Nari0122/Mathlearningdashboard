import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { getAuthOptions } from "@/lib/auth";
import { learningService } from "@/services/learningService";
import StudentHistoryClient from "@/components/features/student/StudentHistoryClient";

export default async function StudentLearningHistoryPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const session = await getServerSession(getAuthOptions(undefined));
    const uid = (session?.user as { sub?: string })?.sub ?? (session?.user as { id?: string })?.id;
    const { id } = await params;
    const studentDocId = id || uid;
    if (!studentDocId) notFound();

    const records = await learningService.getLearningRecords(studentDocId);

    return <StudentHistoryClient records={records} studentDocId={studentDocId} />;
}
