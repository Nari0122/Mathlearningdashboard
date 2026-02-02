import { db } from "@/lib/db";
import { getUnits } from "@/actions/unit-actions";
import AnalysisClient from "@/components/features/admin/AnalysisClient";

export const dynamic = 'force-dynamic';

export default async function AnalysisPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const studentId = parseInt(id);
    const units = await getUnits(studentId);

    return <AnalysisClient units={units} />;
}
