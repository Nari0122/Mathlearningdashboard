import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { getAuthOptions } from "@/lib/auth";
import { getStudentDocIdFromRouteId } from "@/actions/student-actions";
import { learningService } from "@/services/learningService";
import StudentHomeworkClient from "@/components/features/student/StudentHomeworkClient";

export default async function StudentHomeworkPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const session = await getServerSession(getAuthOptions(undefined));
    const uid = (session?.user as { sub?: string })?.sub ?? (session?.user as { id?: string })?.id;
    const { id } = await params;
    const routeId = id || uid;
    if (!routeId) notFound();

    const studentDocId = await getStudentDocIdFromRouteId(routeId);
    if (!studentDocId) notFound();

    const assignments = await learningService.getAssignments(studentDocId);

    return <StudentHomeworkClient assignments={assignments} studentDocId={studentDocId} />;
}
