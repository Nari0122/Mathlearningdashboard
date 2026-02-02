import { getUnits } from "@/actions/unit-actions";
import DashboardClient from "@/components/features/dashboard/DashboardClient";
import { db } from "@/lib/db";

// Force dynamic since we read DB
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
    // 1. Get logged in user (Mock logic: ID 2 is student 'student1' from seed)
    // In real auth, get session.user.id
    // We'll fetch the student user by restricted logic or just static ID 2 for demo
    const studentUser = await db.user.findFirst({ where: { role: 'student' } });
    if (!studentUser) return <div>Student not found in DB. Please run seed.</div>;

    // 2. Fetch units
    const units = await getUnits(studentUser.id);

    return <DashboardClient initialUnits={units} studentId={studentUser.id} />;
}
