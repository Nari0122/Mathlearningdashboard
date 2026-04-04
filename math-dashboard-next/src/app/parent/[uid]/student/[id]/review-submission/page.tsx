import { notFound } from "next/navigation";
import { learningService } from "@/services/learningService";
import StudentReviewSubmissionClient from "@/components/features/student/StudentReviewSubmissionClient";
import type { ReviewProblem } from "@/types/review-submission";

export default async function ParentStudentReviewSubmissionPage({
    params,
}: {
    params: Promise<{ uid: string; id: string }>;
}) {
    const { id: docId } = await params;
    if (!docId) notFound();

    const problems = await learningService.getReviewProblems(docId);
    const typed = problems as ReviewProblem[];
    const clientKey = typed
        .map((p) => `${p.id}:${p.submittedAt ?? ""}:${(p.submissions || []).join(",")}:${p.isLateSubmit}:${p.feedback}:${p.feedbackStatus ?? ""}`)
        .join("|");

    return <StudentReviewSubmissionClient key={clientKey} problems={typed} studentDocId={docId} />;
}
