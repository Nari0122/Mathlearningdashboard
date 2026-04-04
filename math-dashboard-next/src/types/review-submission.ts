export type ReviewFeedbackStatus = "good" | "redo" | "checking";

export interface ReviewProblem {
    id: string;
    /** 책 + 문제 번호 등 */
    bookAndProblem: string;
    unitName: string;
    /** 연관 수업 = schedules 문서 id (숙제 연관 수업과 동일) */
    linkedScheduleId: string;
    classEndTime: string;
    deadline: string;
    createdAt: string;
    submissions: string[];
    submittedAt: string | null;
    isLateSubmit: boolean;
    feedback: string;
    feedbackStatus: ReviewFeedbackStatus | null;
}
