"use client";

import { useState, useEffect } from "react";
import { Lock, PenTool } from "lucide-react";
import { useRouter } from "next/navigation";
import { useReadOnly } from "@/contexts/ReadOnlyContext";
import { PageHeader } from "@/components/shared/PageHeader";
import { HomeworkDeadlineCountdown } from "@/components/shared/HomeworkDeadlineCountdown";

const PROGRESS_OPTIONS = [
    { value: "none", label: "안 함", textClass: "text-red-600" },
    { value: "little", label: "조금", textClass: "text-orange-500" },
    { value: "half", label: "절반", textClass: "text-yellow-600" },
    { value: "almost", label: "거의 다", textClass: "text-lime-600" },
    { value: "done", label: "완료", textClass: "text-green-600" },
] as const;

function getProgressTextClass(progress: string) {
    return PROGRESS_OPTIONS.find(o => o.value === progress)?.textClass || "text-gray-500";
}

function getProgressLabel(progress: string) {
    return PROGRESS_OPTIONS.find(o => o.value === progress)?.label || "안 함";
}

interface StudentHomeworkClientProps {
    assignments: any[];
    studentDocId: string;
}

function formatDate(dateString: string | Date | null) {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
        timeZone: "Asia/Seoul",
        year: "numeric",
        month: "numeric",
        day: "numeric",
    });
}

function formatDateTime(dateString: string | Date | null) {
    if (!dateString) return "";
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

export default function StudentHomeworkClient({ assignments: initialAssignments, studentDocId }: StudentHomeworkClientProps) {
    const router = useRouter();
    const readOnly = useReadOnly();
    const [assignments, setAssignments] = useState(initialAssignments);

    useEffect(() => {
        setAssignments(initialAssignments);
    }, [initialAssignments]);

    const handleProgressChange = (assignmentId: string, newProgress: string) => {
        setAssignments(prev =>
            prev.map(a =>
                a.id === assignmentId
                    ? { ...a, progress: newProgress, progressChangedByAdmin: false }
                    : a
            )
        );

        import("@/actions/student-actions").then(({ updateStudentProgress }) => {
            updateStudentProgress(assignmentId, studentDocId, newProgress as any).then(result => {
                if (result.success) {
                    router.refresh();
                } else {
                    alert("진척도 변경 실패");
                    router.refresh();
                }
            });
        });
    };

    return (
        <div className="space-y-6 text-sm leading-relaxed">
            <PageHeader
                title="숙제 관리"
                description="선생님이 내준 숙제와 진척도를 한눈에 확인하세요."
                icon={
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-[#F0F3FF]">
                        <PenTool className="w-6 h-6 text-[#5D00E2]" />
                    </div>
                }
            />

            <div className="grid grid-cols-1 gap-3 md:gap-4">
                {assignments.map((assignment: any) => {
                    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' });
                    const currentProgress = assignment.progress || "none";
                    const isOverdue = today > assignment.dueDate && currentProgress !== "done";

                    return (
                        <div
                            key={assignment.id}
                            className={`bg-white rounded-xl border ${isOverdue ? "border-red-200" : "border-gray-200"} px-4 py-3 shadow-sm`}
                        >
                            <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className={`font-semibold text-base leading-snug truncate ${currentProgress === "done" ? "line-through text-gray-400" : "text-gray-900"}`}>
                                            {assignment.title}
                                        </span>
                                        {assignment.progressChangedByAdmin && (
                                            <Lock className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                                        )}
                                    </div>
                                    <div className="mt-1 space-y-0.5">
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-500">
                                            <span className={isOverdue ? "text-red-600 font-semibold" : ""}>
                                                마감: {formatDate(assignment.dueDate)}
                                            </span>
                                            {assignment.assignedDate && (
                                                <span>부여: {formatDate(assignment.assignedDate)}</span>
                                            )}
                                            {assignment.submittedDate && (
                                                <span className="text-green-600">
                                                    제출: {formatDateTime(assignment.submittedDate)}
                                                </span>
                                            )}
                                        </div>
                                        <HomeworkDeadlineCountdown
                                            dueDate={assignment.dueDate}
                                            submissionDeadline={assignment.submissionDeadline}
                                            linkedScheduleId={assignment.linkedScheduleId}
                                            className="text-[11px]"
                                        />
                                    </div>
                                    {assignment.isLateUpdate && assignment.lastModifiedDate && (
                                        <div className="mt-1 text-[11px] text-amber-600">
                                            ⚠️ 마감 후 수정됨 · 마지막 수정: {formatDateTime(assignment.lastModifiedDate)}
                                        </div>
                                    )}
                                </div>

                                <div className="shrink-0">
                                    {readOnly ? (
                                        <span className={`text-sm font-medium ${getProgressTextClass(currentProgress)}`}>
                                            {getProgressLabel(currentProgress)}
                                        </span>
                                    ) : (
                                        <select
                                            value={currentProgress}
                                            onChange={(e) => handleProgressChange(assignment.id, e.target.value)}
                                            className={`h-8 rounded-md border border-gray-300 bg-white px-2 text-sm font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-400 ${getProgressTextClass(currentProgress)}`}
                                        >
                                            {PROGRESS_OPTIONS.map(opt => (
                                                <option key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
                {assignments.length === 0 && (
                    <div className="text-center py-8 md:py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <p className="text-gray-500 text-sm">등록된 숙제가 없습니다.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
