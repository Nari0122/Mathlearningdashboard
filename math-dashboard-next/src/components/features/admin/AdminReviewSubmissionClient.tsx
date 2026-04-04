"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Camera, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/shared/PageHeader";
import { classEndAndReviewDeadline } from "@/lib/reviewSubmissionDeadline";
import { ReviewDeadlineCountdownText } from "@/components/shared/ReviewDeadlineCountdownText";
import { PhotoUploadMetaCaption } from "@/components/shared/PhotoUploadMetaCaption";
import {
    adminCreateReviewProblem,
    adminDeleteReviewProblem,
    adminUpdateReviewFeedback,
} from "@/actions/review-submission-actions";
import type { ReviewFeedbackStatus, ReviewProblem } from "@/types/review-submission";
import { cn } from "@/lib/utils";

function formatDateTime(dateString: string | Date | null) {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleString("ko-KR", {
        timeZone: "Asia/Seoul",
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    });
}

const FEEDBACK_OPTIONS: { value: ReviewFeedbackStatus; label: string }[] = [
    { value: "good", label: "잘했어요 ✅" },
    { value: "redo", label: "다시 풀어봐요 🔁" },
    { value: "checking", label: "확인 중 👀" },
];

interface AdminReviewSubmissionClientProps {
    problems: ReviewProblem[];
    schedules: { id: string; date?: string; startTime?: string; endTime?: string; topic?: string; status?: string }[];
    studentDocId: string;
}

function buildFeedbackDraft(problems: ReviewProblem[]) {
    const next: Record<string, { feedback: string; feedbackStatus: ReviewFeedbackStatus | "" }> = {};
    for (const p of problems) {
        next[p.id] = {
            feedback: p.feedback || "",
            feedbackStatus: (p.feedbackStatus as ReviewFeedbackStatus | null) || "",
        };
    }
    return next;
}

export default function AdminReviewSubmissionClient({
    problems,
    schedules,
    studentDocId,
}: AdminReviewSubmissionClientProps) {
    const router = useRouter();
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [bookAndProblem, setBookAndProblem] = useState("");
    const [unitName, setUnitName] = useState("");
    const [linkedScheduleId, setLinkedScheduleId] = useState("");
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
    const [selectedZoomImg, setSelectedZoomImg] = useState<string | null>(null);

    const [feedbackDraft, setFeedbackDraft] = useState(() => buildFeedbackDraft(problems));
    const feedbackDraftRef = useRef(feedbackDraft);
    const [savingFeedbackId, setSavingFeedbackId] = useState<string | null>(null);
    /** 저장 직후 버튼 문구용 (내용 수정 시 해제) */
    const [feedbackSavedIds, setFeedbackSavedIds] = useState<Record<string, boolean>>({});

    useLayoutEffect(() => {
        feedbackDraftRef.current = feedbackDraft;
    }, [feedbackDraft]);

    const previewTimes =
        linkedScheduleId && schedules.length > 0
            ? (() => {
                  const s = schedules.find((x) => x.id === linkedScheduleId);
                  if (s?.date && s?.endTime) return classEndAndReviewDeadline(s.date, s.endTime);
                  return null;
              })()
            : null;

    const handleAdd = async () => {
        if (!bookAndProblem.trim() || !unitName.trim() || !linkedScheduleId) return;
        setIsAddOpen(false);
        const saved = { bookAndProblem: bookAndProblem.trim(), unitName: unitName.trim(), linkedScheduleId };
        setBookAndProblem("");
        setUnitName("");
        setLinkedScheduleId("");
        const res = await adminCreateReviewProblem(studentDocId, saved);
        if (res.success) router.refresh();
        else alert(res.message);
    };

    const handleSaveFeedback = async (problemId: string) => {
        const d = feedbackDraftRef.current[problemId];
        if (!d) {
            alert("저장할 피드백 정보를 찾을 수 없습니다. 페이지를 새로고침한 뒤 다시 시도해 주세요.");
            return;
        }
        setSavingFeedbackId(problemId);
        try {
            const res = await adminUpdateReviewFeedback(studentDocId, problemId, {
                feedback: d.feedback,
                feedbackStatus: d.feedbackStatus === "" ? null : d.feedbackStatus,
            });
            if (res.success) {
                setFeedbackSavedIds((prev) => ({ ...prev, [problemId]: true }));
                router.refresh();
            } else alert(res.message);
        } catch (e) {
            console.error("[AdminReviewSubmission] save feedback", e);
            alert(e instanceof Error ? e.message : "저장 중 오류가 발생했습니다.");
        } finally {
            setSavingFeedbackId(null);
        }
    };

    const clearFeedbackSaved = (problemId: string) => {
        setFeedbackSavedIds((prev) => {
            if (!prev[problemId]) return prev;
            const next = { ...prev };
            delete next[problemId];
            return next;
        });
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        const id = deleteTarget;
        setDeleteTarget(null);
        const res = await adminDeleteReviewProblem(studentDocId, id);
        if (res.success) router.refresh();
        else alert(res.message);
    };

    const scheduledList = schedules.filter((s) => s.status === "scheduled");

    return (
        <div className="space-y-6 text-sm leading-relaxed">
            <PageHeader
                title="복습 제출"
                description="수업 복습 문제를 등록하고, 학생이 올린 풀이 사진에 피드백을 남깁니다."
                icon={
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-[#F0F3FF]">
                        <Camera className="w-6 h-6 text-[#5D00E2]" />
                    </div>
                }
                actions={
                    <Button type="button" onClick={() => setIsAddOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        문제 등록
                    </Button>
                }
            />

            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>복습 문제 등록</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-2">
                        <div className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-3">
                            <Label htmlFor="book" className="text-right whitespace-nowrap text-sm">
                                책·번호
                            </Label>
                            <Input
                                id="book"
                                value={bookAndProblem}
                                onChange={(e) => setBookAndProblem(e.target.value)}
                                placeholder="예: 수학의 정석 3단원 12번"
                            />
                            <Label htmlFor="unit" className="text-right whitespace-nowrap text-sm">
                                단원명
                            </Label>
                            <Input
                                id="unit"
                                value={unitName}
                                onChange={(e) => setUnitName(e.target.value)}
                                placeholder="예: 이차방정식"
                            />
                        </div>
                        {scheduledList.length > 0 ? (
                            <div className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2">
                                <Label htmlFor="linkedSchedule" className="text-right whitespace-nowrap text-sm">
                                    연관 수업
                                </Label>
                                <select
                                    id="linkedSchedule"
                                    value={linkedScheduleId}
                                    onChange={(e) => setLinkedScheduleId(e.target.value)}
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                                >
                                    <option value="">수업을 선택하세요</option>
                                    {scheduledList.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.date} {s.startTime} ~ {s.endTime} {s.topic ? `- ${s.topic}` : ""}
                                        </option>
                                    ))}
                                </select>
                                <div />
                                <p className="text-xs text-muted-foreground">
                                    숙제 마감 설정과 동일하게 예정된 수업만 표시됩니다. 마감은 수업 종료 시각 + 2시간입니다.
                                </p>
                            </div>
                        ) : (
                            <p className="text-sm text-amber-700">예정된 수업 일정이 없어 연결할 수 없습니다. 먼저 수업 일정을 등록해 주세요.</p>
                        )}
                        {previewTimes && (
                            <div className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground space-y-1">
                                <div>수업 종료(참고): {formatDateTime(previewTimes.classEndTime)}</div>
                                <div className="font-medium text-foreground">제출 마감: {formatDateTime(previewTimes.deadline)}</div>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button type="button" onClick={handleAdd} disabled={!scheduledList.length}>
                            등록하기
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div className="space-y-4">
                {problems.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-gray-500">
                        등록된 복습 문제가 없습니다.
                    </div>
                ) : (
                    problems.map((p) => {
                        const draft = feedbackDraft[p.id] ?? { feedback: "", feedbackStatus: "" as const };
                        const linked = schedules.find((s) => s.id === p.linkedScheduleId);

                        return (
                            <div
                                key={p.id}
                                className="bg-white rounded-xl border border-gray-200 p-4 md:p-5 space-y-4 shadow-sm relative z-0"
                            >
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div className="min-w-0 space-y-1">
                                        <h3 className="font-semibold text-base">{p.bookAndProblem}</h3>
                                        <p className="text-sm text-muted-foreground">단원: {p.unitName}</p>
                                        <p className="text-xs text-muted-foreground">
                                            연관 수업:{" "}
                                            {linked
                                                ? `${linked.date} ${linked.startTime} ~ ${linked.endTime}${linked.topic ? ` · ${linked.topic}` : ""}`
                                                : "(일정 없음 또는 변경됨)"}
                                        </p>
                                        <ReviewDeadlineCountdownText deadlineIso={p.deadline} />
                                        <p className="text-xs text-gray-500">마감 시각: {formatDateTime(p.deadline)}</p>
                                    </div>
                                    <Button variant="ghost" size="sm" className="text-red-600 shrink-0" onClick={() => setDeleteTarget(p.id)}>
                                        <Trash2 className="w-4 h-4 mr-1" />
                                        삭제
                                    </Button>
                                </div>

                                <div className="border-t pt-3 space-y-2">
                                    <p className="text-xs font-medium text-gray-500">학생 제출</p>
                                    <p className="text-[11px] text-muted-foreground">
                                        제출 시점의 용량·압축 여부가 저장된 사진은 썸네일 아래에 표시됩니다. (구버전 제출은 URL만 있습니다.)
                                    </p>
                                    {p.submissions?.length ? (
                                        <div className="flex flex-wrap gap-3">
                                            {p.submissions.map((ph, i) => (
                                                <div key={i} className="flex flex-col w-[min(140px,100%)]">
                                                    <div
                                                        role="button"
                                                        tabIndex={0}
                                                        className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200 cursor-zoom-in group"
                                                        onClick={() => setSelectedZoomImg(ph.url)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === "Enter" || e.key === " ") {
                                                                e.preventDefault();
                                                                setSelectedZoomImg(ph.url);
                                                            }
                                                        }}
                                                    >
                                                        <img
                                                            src={ph.url}
                                                            alt=""
                                                            className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                                                        />
                                                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                                            <span className="text-[10px] font-medium bg-white/90 text-gray-900 px-2 py-1 rounded shadow">
                                                                클릭하여 확대
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <PhotoUploadMetaCaption
                                                        sizeKb={ph.sizeKb}
                                                        compressed={ph.compressed}
                                                        compressionFailed={ph.compressionFailed}
                                                        className="text-[11px]"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-400">아직 제출 없음</p>
                                    )}
                                    {p.submittedAt && (
                                        <p className="text-xs text-gray-500">
                                            제출 시각: {formatDateTime(p.submittedAt)}
                                            {p.isLateSubmit && <span className="ml-2 text-amber-600">⚠️ 마감 후 제출됨</span>}
                                        </p>
                                    )}
                                </div>

                                <div className="border-t pt-3 space-y-3 relative z-10 isolate">
                                    <Label className="text-xs text-gray-500">피드백</Label>
                                    <Textarea
                                        value={draft.feedback}
                                        onChange={(e) => {
                                            clearFeedbackSaved(p.id);
                                            setFeedbackDraft((prev) => ({
                                                ...prev,
                                                [p.id]: {
                                                    ...(prev[p.id] ?? { feedback: "", feedbackStatus: "" as const }),
                                                    feedback: e.target.value,
                                                },
                                            }));
                                        }}
                                        placeholder="학생에게 전할 코멘트를 입력하세요."
                                        rows={3}
                                        className="text-sm"
                                    />
                                    <div className="flex flex-wrap items-center gap-3">
                                        <select
                                            value={draft.feedbackStatus}
                                            onChange={(e) => {
                                                clearFeedbackSaved(p.id);
                                                setFeedbackDraft((prev) => ({
                                                    ...prev,
                                                    [p.id]: {
                                                        ...(prev[p.id] ?? { feedback: "", feedbackStatus: "" as const }),
                                                        feedbackStatus: e.target.value as ReviewFeedbackStatus | "",
                                                    },
                                                }));
                                            }}
                                            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                                        >
                                            <option value="">상태 태그 선택</option>
                                            {FEEDBACK_OPTIONS.map((o) => (
                                                <option key={o.value} value={o.value}>
                                                    {o.label}
                                                </option>
                                            ))}
                                        </select>
                                        <Button
                                            type="button"
                                            size="sm"
                                            disabled={savingFeedbackId === p.id}
                                            onClick={() => void handleSaveFeedback(p.id)}
                                            className={cn(
                                                feedbackSavedIds[p.id] &&
                                                    "bg-green-600 text-white hover:bg-green-600/90 border-transparent"
                                            )}
                                        >
                                            {savingFeedbackId === p.id
                                                ? "저장 중…"
                                                : feedbackSavedIds[p.id]
                                                  ? "저장 완료"
                                                  : "피드백 저장"}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <Dialog open={!!selectedZoomImg} onOpenChange={(open) => !open && setSelectedZoomImg(null)}>
                <DialogContent showCloseButton={false} className="max-w-[95vw] w-fit p-1 bg-black/90 border-none">
                    <DialogTitle className="sr-only">이미지 확대</DialogTitle>
                    {selectedZoomImg && (
                        <div className="relative flex items-center justify-center min-h-[50vh]">
                            <img
                                src={selectedZoomImg}
                                alt="학생 제출 사진 확대"
                                className="max-h-[85vh] max-w-full object-contain"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute -top-1 -right-1 text-white hover:bg-white/20 rounded-full"
                                onClick={() => setSelectedZoomImg(null)}
                            >
                                <X className="h-6 w-6" />
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>문제 삭제</AlertDialogTitle>
                        <AlertDialogDescription>이 복습 문제와 제출·피드백 기록이 모두 삭제됩니다. 계속할까요?</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>취소</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                            삭제
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
