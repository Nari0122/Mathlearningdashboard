"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, AlertCircle, X, PenTool } from "lucide-react";
import { submitHomework } from "@/actions/student-actions";
import { useRouter } from "next/navigation";
import { useReadOnly } from "@/contexts/ReadOnlyContext";
import { isSubmissionLocked } from "@/lib/submissionDeadline";

interface StudentHomeworkClientProps {
    assignments: any[];
    /** Firestore 학생 문서 ID (학부모/학생 공통) */
    studentDocId: string;
}

function formatDate(dateString: string | Date | null) {
    if (!dateString) return "";
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}. ${month}. ${day}.`;
}

export default function StudentHomeworkClient({ assignments, studentDocId }: StudentHomeworkClientProps) {
    const router = useRouter();
    const readOnly = useReadOnly();
    const [isPending, startTransition] = useTransition();

    const handleToggleComplete = async (assignmentId: string, currentStatus: string) => {
        startTransition(async () => {
            const result = await submitHomework(assignmentId, studentDocId);
            if (result.success) {
                router.refresh();
            } else {
                alert("숙제 제출 실패");
            }
        });
    };

    const handleCancelComplete = async (assignmentId: string) => {
        startTransition(async () => {
            // Import updateHomework to reset status
            const { updateHomework } = await import("@/actions/admin-actions");
            const assignment = assignments.find((a: any) => a.id === assignmentId);

            if (assignment) {
                const result = await updateHomework(assignmentId, studentDocId, {
                    title: assignment.title,
                    dueDate: assignment.dueDate,
                    status: 'pending',
                    submittedDate: null as any
                });

                if (result.success) {
                    router.refresh();
                } else {
                    alert("완료 취소 실패");
                }
            }
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-[#F0F3FF]">
                    <PenTool className="w-6 h-6 text-[#5D00E2]" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-[#2F3438]">숙제 관리</h1>
                    <p className="text-sm text-[#6C727A] mt-0.5">선생님이 내준 숙제와 제출 현황을 확인하세요.</p>
                </div>
            </div>
            <div className="grid grid-cols-1 gap-4">
                {assignments.map((assignment: any) => {
                    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' });
                    const isOverdue = today > assignment.dueDate && assignment.status !== 'submitted' && assignment.status !== 'late-submitted';
                    const isExpired = assignment.status === 'expired';
                    const isCompleted = assignment.status === 'submitted' || assignment.status === 'late-submitted';
                    const submissionLocked = isSubmissionLocked(assignment);

                    return (
                        <Card key={assignment.id} className={isOverdue || isExpired ? "border-red-200" : ""}>
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <CardTitle className={`text-lg ${isCompleted ? 'line-through text-gray-400' : ''}`}>
                                        {assignment.title}
                                    </CardTitle>
                                    <div className="flex items-center gap-2">
                                        {assignment.status === 'submitted' ? (
                                            <>
                                                <Badge className="bg-green-600 hover:bg-green-700">
                                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                                    제출 완료
                                                </Badge>
                                                {!readOnly && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleCancelComplete(assignment.id)}
                                                        disabled={isPending}
                                                        className="text-red-600 hover:text-red-700"
                                                    >
                                                        <X className="w-4 h-4 mr-1" />
                                                        완료 취소
                                                    </Button>
                                                )}
                                            </>
                                        ) : assignment.status === 'late-submitted' ? (
                                            <>
                                                <Badge className="bg-yellow-500 hover:bg-yellow-600">
                                                    지각 제출
                                                </Badge>
                                                {!readOnly && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleCancelComplete(assignment.id)}
                                                        disabled={isPending}
                                                        className="text-red-600 hover:text-red-700"
                                                    >
                                                        <X className="w-4 h-4 mr-1" />
                                                        완료 취소
                                                    </Button>
                                                )}
                                            </>
                                        ) : (
                                            <>
                                                <Badge variant="outline" className="text-gray-500">
                                                    {isExpired ? "기한 만료" : "미제출"}
                                                </Badge>
                                                {(isOverdue || isExpired) && (
                                                    <Badge variant="destructive" className="bg-red-600 hover:bg-red-700">
                                                        <AlertCircle className="w-3 h-3 mr-1" />
                                                        마감됨
                                                    </Badge>
                                                )}
                                                {!readOnly && !submissionLocked && (
                                                    <Button
                                                        variant="default"
                                                        size="sm"
                                                        onClick={() => handleToggleComplete(assignment.id, assignment.status)}
                                                        disabled={isPending}
                                                        className="bg-blue-600 hover:bg-blue-700"
                                                    >
                                                        <CheckCircle2 className="w-4 h-4 mr-1" />
                                                        완료하기
                                                    </Button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-sm text-gray-500 space-y-1">
                                    {submissionLocked && !isCompleted && (
                                        <p className="text-amber-700 font-medium bg-amber-50 rounded px-2 py-1">
                                            수업 준비를 위해 과제 제출이 마감되었습니다.
                                        </p>
                                    )}
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4" />
                                        <span className={isOverdue || isExpired ? "text-red-600 font-semibold" : ""}>
                                            마감: {formatDate(assignment.dueDate)}
                                        </span>
                                    </div>
                                    {assignment.assignedDate && (
                                        <p>부여일: {formatDate(assignment.assignedDate)}</p>
                                    )}
                                    {assignment.submittedDate && (
                                        <p className="text-green-600">
                                            제출일: {formatDate(assignment.submittedDate)}
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
                {assignments.length === 0 && (
                    <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <p className="text-gray-500">등록된 숙제가 없습니다.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
