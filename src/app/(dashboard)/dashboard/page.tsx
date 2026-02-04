import { getUnits } from "@/actions/unit-actions";
import DashboardClient from "@/components/features/dashboard/DashboardClient";
import { studentService } from "@/services/studentService";

// Force dynamic since we read DB
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
    // 1. Get logged in user from Firestore
    const studentUser = await studentService.getFirstStudent();
    if (!studentUser) return <div>Student not found in DB. Please run seed.</div>;

    // 2. Fetch units
    const units = await getUnits(studentUser.id);

    return <DashboardClient initialUnits={units} studentId={studentUser.id} />;
}
