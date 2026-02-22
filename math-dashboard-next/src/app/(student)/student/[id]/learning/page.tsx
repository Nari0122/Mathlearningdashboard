import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { getAuthOptions } from "@/lib/auth";
import { learningService } from "@/services/learningService";
import StudentLearningClient from "@/components/features/student/StudentLearningClient";

export default async function StudentLearningPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const session = await getServerSession(getAuthOptions(undefined));
    const uid = (session?.user as { sub?: string })?.sub ?? (session?.user as { id?: string })?.id;
    const { id } = await params;
    const studentDocId = id || uid;
    if (!studentDocId) notFound();

    const units = await learningService.getUnits(studentDocId);

    const mappedUnits = units.map((u: any) => ({
        ...u,
        errors: {
            C: u.errorC || 0,
            M: u.errorM || 0,
            R: u.errorR || 0,
            S: u.errorS || 0,
        }
    }));

    return <StudentLearningClient units={mappedUnits} studentDocId={studentDocId} />;
}
