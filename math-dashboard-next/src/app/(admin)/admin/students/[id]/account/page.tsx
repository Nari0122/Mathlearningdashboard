import { getStudentDetailByDocId } from "@/actions/student-actions";
import StudentAccountManagementClient from "@/components/features/admin/StudentAccountManagementClient";
import { notFound } from "next/navigation";
import { getConnectedParentsForStudent } from "@/actions/parent-actions";

export default async function StudentAccountPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id: docId } = await params;
    const student = await getStudentDetailByDocId(docId);

    if (!student) {
        notFound();
    }

    const linkedParents = await getConnectedParentsForStudent(docId);

    return <StudentAccountManagementClient student={student} studentDocId={docId} linkedParents={linkedParents} />;
}
