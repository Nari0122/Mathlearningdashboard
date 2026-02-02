import { getStudents } from "@/actions/student-actions";
import StudentsClient from "@/components/features/admin/StudentsClient";

export const dynamic = 'force-dynamic';

export default async function StudentManagementPage() {
    const students = await getStudents();

    return <StudentsClient initialStudents={students} />;
}
