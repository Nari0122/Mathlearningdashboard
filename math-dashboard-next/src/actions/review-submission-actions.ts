"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { getAuthOptions } from "@/lib/auth";
import { learningService } from "@/services/learningService";
import { userService } from "@/services/userService";
import { classEndAndReviewDeadline, isPastReviewDeadline } from "@/lib/reviewSubmissionDeadline";
import { toKSTISOString } from "@/lib/date-kst";
import type { ReviewFeedbackStatus } from "@/types/review-submission";

function getSessionUid(): Promise<string | null> {
    return getServerSession(getAuthOptions(undefined)).then(
        (session) =>
            (session?.user as { sub?: string })?.sub ?? (session?.user as { id?: string })?.id ?? null
    );
}

async function assertAdmin(): Promise<{ ok: true; uid: string } | { ok: false; message: string }> {
    const uid = await getSessionUid();
    if (!uid) return { ok: false, message: "로그인이 필요합니다." };
    const admin = await userService.getAdmin(uid);
    const role = admin && (admin as { role?: string }).role;
    if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
        return { ok: false, message: "관리자만 할 수 있습니다." };
    }
    if ((admin as { status?: string })?.status === "PENDING") {
        return { ok: false, message: "관리자 승인 후 이용할 수 있습니다." };
    }
    return { ok: true, uid };
}

async function assertStudent(studentDocId: string): Promise<{ ok: true } | { ok: false; message: string }> {
    const uid = await getSessionUid();
    if (!uid) return { ok: false, message: "로그인이 필요합니다." };
    if (uid !== studentDocId) return { ok: false, message: "본인 제출만 가능합니다." };
    return { ok: true };
}

function revalidateReviewPaths(studentDocId: string) {
    revalidatePath(`/admin/students/${studentDocId}/review-submission`);
    revalidatePath(`/student/${studentDocId}/review-submission`);
    revalidatePath("/parent", "layout");
}

export async function adminCreateReviewProblem(
    studentDocId: string,
    payload: { bookAndProblem: string; unitName: string; linkedScheduleId: string }
): Promise<{ success: true } | { success: false; message: string }> {
    const auth = await assertAdmin();
    if (!auth.ok) return { success: false, message: auth.message };

    const { bookAndProblem, unitName, linkedScheduleId } = payload;
    if (!bookAndProblem?.trim() || !unitName?.trim() || !linkedScheduleId) {
        return { success: false, message: "책·번호, 단원명, 연관 수업을 모두 입력해 주세요." };
    }

    const schedule = (await learningService.getSchedule(studentDocId, linkedScheduleId)) as {
        date?: string;
        endTime?: string;
        status?: string;
    } | null;
    if (!schedule?.date || !schedule?.endTime) {
        return { success: false, message: "선택한 수업 일정을 찾을 수 없습니다." };
    }
    if (schedule.status !== "scheduled") {
        return { success: false, message: "예정된 수업만 연결할 수 있습니다." };
    }

    const { classEndTime, deadline } = classEndAndReviewDeadline(schedule.date, schedule.endTime);

    const result = await learningService.createReviewProblem(studentDocId, {
        bookAndProblem: bookAndProblem.trim(),
        unitName: unitName.trim(),
        linkedScheduleId,
        classEndTime,
        deadline,
    });

    if (result.success) revalidateReviewPaths(studentDocId);
    return result.success ? { success: true } : { success: false, message: result.message || "등록에 실패했습니다." };
}

export async function adminUpdateReviewFeedback(
    studentDocId: string,
    problemId: string,
    payload: { feedback: string; feedbackStatus: ReviewFeedbackStatus | null }
): Promise<{ success: true } | { success: false; message: string }> {
    const auth = await assertAdmin();
    if (!auth.ok) return { success: false, message: auth.message };

    const existing = await learningService.getReviewProblem(studentDocId, problemId);
    if (!existing) return { success: false, message: "문제를 찾을 수 없습니다." };

    const result = await learningService.updateReviewProblem(studentDocId, problemId, {
        feedback: payload.feedback ?? "",
        feedbackStatus: payload.feedbackStatus,
    });

    if (result.success) revalidateReviewPaths(studentDocId);
    return result.success ? { success: true } : { success: false, message: result.message || "저장에 실패했습니다." };
}

export async function adminDeleteReviewProblem(
    studentDocId: string,
    problemId: string
): Promise<{ success: true } | { success: false; message: string }> {
    const auth = await assertAdmin();
    if (!auth.ok) return { success: false, message: auth.message };

    const result = await learningService.deleteReviewProblem(studentDocId, problemId);
    if (result.success) revalidateReviewPaths(studentDocId);
    return result.success ? { success: true } : { success: false, message: result.message || "삭제에 실패했습니다." };
}

export async function studentSubmitReviewPhotos(
    studentDocId: string,
    problemId: string,
    photoUrls: string[]
): Promise<{ success: true } | { success: false; message: string }> {
    const auth = await assertStudent(studentDocId);
    if (!auth.ok) return { success: false, message: auth.message };

    if (!Array.isArray(photoUrls) || photoUrls.length === 0) {
        return { success: false, message: "제출할 사진을 한 장 이상 선택해 주세요." };
    }

    const problem = await learningService.getReviewProblem(studentDocId, problemId);
    if (!problem) return { success: false, message: "문제를 찾을 수 없습니다." };

    const late = isPastReviewDeadline(problem.deadline);

    const result = await learningService.updateReviewProblem(studentDocId, problemId, {
        submissions: photoUrls,
        submittedAt: toKSTISOString(),
        isLateSubmit: late,
    });

    if (result.success) revalidateReviewPaths(studentDocId);
    return result.success ? { success: true } : { success: false, message: result.message || "제출에 실패했습니다." };
}
