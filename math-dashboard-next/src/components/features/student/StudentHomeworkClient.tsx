"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, AlertCircle, X, PenTool } from "lucide-react";
import { submitHomework } from "@/actions/student-actions";
import { useRouter } from "next/navigation";
import { useReadOnly } from "@/contexts/ReadOnlyContext";
import { isSubmissionLocked, isLateSubmissionLocked } from "@/lib/submissionDeadline";
import { PageHeader } from "@/components/shared/PageHeader";

interface StudentHomeworkClientProps {
    assignments: any[];
    /** Firestore 학생 문서 ID (학부모/학생 공통) */
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

    const handleToggleComplete = async (assignmentId: string, currentStatus: string) => {
        setAssignments(prev =>
            prev.map(a =>
                a.id === assignmentId
                    ? { ...a, status: 'submitted', submittedDate: new Date().toISOString() }
                    : a
            )
        );

        submitHomework(assignmentId, studentDocId).then(result => {
            if (result.success) {
                router.refresh();
            } else {
                alert("숙제 제출 실패");
                router.refresh();
            }
        });
    };

    const handleCancelComplete = async (assignmentId: string) => {
        setAssignments(prev =>
            prev.map(a =>
                a.id === assignmentId
                    ? { ...a, status: 'pending', submittedDate: null }
                    : a
            )
        );

        import("@/actions/admin-actions").then(({ updateHomework }) => {
            const assignment = initialAssignments.find((a: any) => a.id === assignmentId);
            if (assignment) {
                updateHomework(assignmentId, studentDocId, {
                    title: assignment.title,
                    dueDate: assignment.dueDate,
                    status: 'pending',
                    submittedDate: null as any
                }).then(result => {
                    if (result.success) {
                        router.refresh();
                    } else {
                        alert("완료 취소 실패");
                        router.refresh();
                    }
                });
            }
        });
    };

    return (
        <div className="space-y-6 text-sm leading-relaxed">
            <PageHeader
                title="숙제 관리"
                description="선생님이 내준 숙제와 제출 현황을 한눈에 확인하세요."
                icon={
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-[#F0F3FF]">
                        <PenTool className="w-6 h-6 text-[#5D00E2]" />
                    </div>
                }
            />
            <div className="grid grid-cols-1 gap-3 md:gap-4">
                {assignments.map((assignment: any) => {
                    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' });
                    const isOverdue = today > assignment.dueDate && assignment.status !== 'submitted' && assignment.status !== 'late-submitted';
                    const isExpired = assignment.status === 'expired';
                    const isCompleted = assignment.status === 'submitted' || assignment.status === 'late-submitted';
                    const submissionLocked = isSubmissionLocked(assignment);
                    const lateSubmissionLocked = isLateSubmissionLocked(assignment);

                    return (
                        <Card key={assignment.id} className={`py-0 gap-0 ${isOverdue || isExpired ? "border-red-200" : ""}`}>
                            <CardHeader className="px-3 pt-2.5 pb-1 md:px-5 md:pt-3 md:pb-1.5">
                                <div className="flex items-center justify-between gap-2">
                                    <CardTitle className={`text-base md:text-lg font-semibold leading-snug min-w-0 break-keep ${isCompleted ? 'line-through text-gray-400' : ''}`}>
                                        {assignment.title}
                                    </CardTitle>
                                    <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
                                        {assignment.status === 'submitted' ? (
                                            <>
                                                <Badge className="bg-green-600 hover:bg-green-700 text-[11px] md:text-xs px-1.5 py-0.5 md:px-2 whitespace-nowrap">
                                                    <CheckCircle2 className="w-3 h-3 mr-0.5" />
                                                    제출 완료
                                                </Badge>
                                                {!readOnly && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleCancelComplete(assignment.id)}
                                                        className="text-red-600 hover:text-red-700 h-6 text-[11px] px-1.5 md:h-8 md:text-sm md:px-3"
                                                    >
                                                        <X className="w-3 h-3 mr-0.5" />
                                                        취소
                                                    </Button>
                                                )}
                                            </>
                                        ) : assignment.status === 'late-submitted' ? (
                                            <>
                                                <Badge className="bg-yellow-500 hover:bg-yellow-600 text-[11px] md:text-xs px-1.5 py-0.5 md:px-2 whitespace-nowrap">
                                                    지각 제출
                                                </Badge>
                                                {!readOnly && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleCancelComplete(assignment.id)}
                                                        className="text-red-600 hover:text-red-700 h-6 text-[11px] px-1.5 md:h-8 md:text-sm md:px-3"
                                                    >
                                                        <X className="w-3 h-3 mr-0.5" />
                                                        취소
                                                    </Button>
                                                )}
                                            </>
                                        ) : (
                                            <>
                                                <Badge variant="outline" className="text-gray-500 text-[11px] md:text-xs px-1.5 py-0.5 md:px-2 whitespace-nowrap">
                                                    {isExpired ? "기한 만료" : "미제출"}
                                                </Badge>
                                                {lateSubmissionLocked && (
                                                    <Badge variant="destructive" className="bg-red-600 hover:bg-red-700 text-[11px] md:text-xs px-1.5 py-0.5 md:px-2 whitespace-nowrap">
                                                        <AlertCircle className="w-3 h-3 mr-0.5" />
                                                        마감
                                                    </Badge>
                                                )}
                                                {!readOnly && !lateSubmissionLocked && !submissionLocked && (
                                                    <Button
                                                        variant="default"
                                                        size="sm"
                                                        onClick={() => handleToggleComplete(assignment.id, assignment.status)}
                                                        className="bg-blue-600 hover:bg-blue-700 h-6 text-[11px] px-2 md:h-8 md:text-sm md:px-3 whitespace-nowrap"
                                                    >
                                                        <CheckCircle2 className="w-3 h-3 mr-0.5" />
                                                        완료하기
                                                    </Button>
                                                )}
                                                {!readOnly && !lateSubmissionLocked && submissionLocked && (
                                                    <Button
                                                        variant="default"
                                                        size="sm"
                                                        onClick={() => handleToggleComplete(assignment.id, assignment.status)}
                                                        className="bg-amber-500 hover:bg-amber-600 h-6 text-[11px] px-2 md:h-8 md:text-sm md:px-3 whitespace-nowrap"
                                                    >
                                                        <Clock className="w-3 h-3 mr-0.5" />
                                                        지각 제출
                                                    </Button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="px-3 pb-2.5 md:px-5 md:pb-3">
                                <div className="text-xs md:text-sm text-gray-500 space-y-0.5 md:space-y-1">
                                    {submissionLocked && !lateSubmissionLocked && !isCompleted && (
                                        <p className="text-amber-700 text-xs font-medium bg-amber-50 rounded px-2 py-1">
                                            {assignment.linkedScheduleId
                                                ? "숙제 마감 기한이 지났습니다. 수업 시작 10분 전까지 지각 제출이 가능합니다."
                                                : "숙제 마감 기한이 지났습니다. 마감일 기준 다음날 밤 23:59까지 지각 제출이 가능합니다."}
                                        </p>
                                    )}
                                    {lateSubmissionLocked && !isCompleted && (
                                        <p className="text-red-700 text-xs font-medium bg-red-50 rounded px-2 py-1">
                                            지각 제출 기한이 만료되었습니다.
                                        </p>
                                    )}
                                    <p className={isOverdue || isExpired ? "text-red-600 font-semibold" : ""}>
                                        마감일: {formatDate(assignment.dueDate)}
                                    </p>
                                    {assignment.assignedDate && (
                                        <p>부여일: {formatDate(assignment.assignedDate)}</p>
                                    )}
                                    {assignment.submittedDate && (
                                        <p className="text-green-600">
                                            제출일: {formatDateTime(assignment.submittedDate)}
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
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
