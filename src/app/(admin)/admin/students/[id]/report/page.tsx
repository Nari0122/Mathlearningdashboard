import { db } from "@/lib/db";
import { getUnits } from "@/actions/unit-actions";
import ReportClient from "@/components/features/admin/ReportClient";

export const dynamic = 'force-dynamic';

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const studentId = parseInt(id);
    const student = await db.user.findUnique({ where: { id: studentId } });
    const units = await getUnits(studentId);

    // Fetch learning records for statistics calculation
    const learningRecords = await db.learningRecord.findMany({
        where: { userId: studentId },
        orderBy: { date: 'asc' }
    });

    return <ReportClient units={units} studentName={student?.name || "학생"} learningRecords={learningRecords} />;
}
