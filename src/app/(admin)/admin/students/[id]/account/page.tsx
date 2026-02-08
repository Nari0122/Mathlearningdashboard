import { getStudentDetail } from "@/actions/student-actions";
import StudentAccountManagementClient from "@/components/features/admin/StudentAccountManagementClient";
import { notFound } from "next/navigation";

export default async function StudentAccountPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const student = await getStudentDetail(id);

    if (!student) {
        notFound();
    }

    return <StudentAccountManagementClient student={student} />;
}
