import { notFound } from "next/navigation";
import { getStudentDocIdFromRouteId } from "@/actions/student-actions";
import { getPendingParentRequests, getConnectedParentsForStudent } from "@/actions/parent-actions";
import { StudentLinksClient } from "@/components/features/student/StudentLinksClient";

export const dynamic = "force-dynamic";

export default async function StudentLinksPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id: routeId } = await params;
    const studentDocId = await getStudentDocIdFromRouteId(routeId);
    if (!studentDocId) notFound();

    const [pendingRequests, connectedParents] = await Promise.all([
        getPendingParentRequests(studentDocId),
        getConnectedParentsForStudent(studentDocId),
    ]);

    return (
        <StudentLinksClient
            studentDocId={studentDocId}
            pendingRequests={pendingRequests}
            connectedParents={connectedParents}
        />
    );
}
