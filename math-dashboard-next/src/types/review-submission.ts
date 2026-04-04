export type ReviewFeedbackStatus = "good" | "redo" | "checking";

/** 복습 제출 사진 한 장 (Firestore 배열 요소, 구버전은 url 문자열만 저장됨) */
export interface ReviewSubmissionPhoto {
    url: string;
    sizeKb?: number;
    compressed?: boolean;
    /** 이미지 압축을 시도했으나 실패해 원본으로 올린 경우 */
    compressionFailed?: boolean;
}

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
    submissions: ReviewSubmissionPhoto[];
    submittedAt: string | null;
    isLateSubmit: boolean;
    feedback: string;
    feedbackStatus: ReviewFeedbackStatus | null;
}

/** 클라이언트 key·캐시용: 제출 URL 목록만 이어 붙임 */
export function reviewSubmissionsFingerprint(submissions: ReviewSubmissionPhoto[]): string {
    return submissions.map((s) => s.url).join(",");
}
