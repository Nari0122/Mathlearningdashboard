import { getUnits } from "@/actions/unit-actions";
import AnalysisClient from "@/components/features/admin/AnalysisClient";

export const dynamic = 'force-dynamic';

export default async function AnalysisPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: docId } = await params;
    if (!docId) return null;
    const units = await getUnits(docId);

    return <AnalysisClient units={units} />;
}
