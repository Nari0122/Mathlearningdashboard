import { getStudentDetailByDocId } from "@/actions/student-actions";
import { notFound } from "next/navigation";
import AdminReviewSubmissionClient from "@/components/features/admin/AdminReviewSubmissionClient";
import type { ReviewProblem } from "@/types/review-submission";

export const dynamic = "force-dynamic";

export default async function AdminReviewSubmissionPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id: docId } = await params;
    if (!docId) notFound();

    const student = await getStudentDetailByDocId(docId);
    if (!student) notFound();

    const { learningService } = await import("@/services/learningService");
    const [problems, schedules] = await Promise.all([
        learningService.getReviewProblems(docId),
        learningService.getSchedules(docId),
    ]);

    const typed = problems as ReviewProblem[];
    const clientKey = typed
        .map(
            (p) =>
                `${p.id}:${p.submittedAt ?? ""}:${(p.submissions || []).join(",")}:${p.feedback}:${p.feedbackStatus ?? ""}:${p.deadline}`
        )
        .join("|");

    return (
        <AdminReviewSubmissionClient
            key={clientKey}
            problems={typed}
            schedules={schedules}
            studentDocId={docId}
        />
    );
}
