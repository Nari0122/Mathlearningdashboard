"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, AlertCircle, X } from "lucide-react";
import { submitHomework } from "@/actions/student-actions";
import { useRouter } from "next/navigation";

interface StudentHomeworkClientProps {
    assignments: any[];
    studentId: number;
}

function formatDate(dateString: string | Date | null) {
    if (!dateString) return "";
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}. ${month}. ${day}.`;
}

export default function StudentHomeworkClient({ assignments, studentId }: StudentHomeworkClientProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const handleToggleComplete = async (assignmentId: string, currentStatus: string) => {
        startTransition(async () => {
            const result = await submitHomework(assignmentId, studentId);
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
                const result = await updateHomework(assignmentId, studentId, {
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
            <h1 className="text-2xl font-bold">숙제 관리</h1>
            <div className="grid grid-cols-1 gap-4">
                {assignments.map((assignment: any) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const dueDate = new Date(assignment.dueDate);
                    dueDate.setHours(0, 0, 0, 0);
                    const isOverdue = today > dueDate && assignment.status !== 'submitted' && assignment.status !== 'late-submitted';
                    const isCompleted = assignment.status === 'submitted' || assignment.status === 'late-submitted';

                    return (
                        <Card key={assignment.id} className={isOverdue ? "border-red-200" : ""}>
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
                                            </>
                                        ) : assignment.status === 'late-submitted' ? (
                                            <>
                                                <Badge className="bg-yellow-500 hover:bg-yellow-600">
                                                    지각 제출
                                                </Badge>
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
                                            </>
                                        ) : (
                                            <>
                                                <Badge variant="outline" className="text-gray-500">
                                                    미제출
                                                </Badge>
                                                {isOverdue && (
                                                    <Badge variant="destructive" className="bg-red-600 hover:bg-red-700">
                                                        <AlertCircle className="w-3 h-3 mr-1" />
                                                        마감됨
                                                    </Badge>
                                                )}
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
                                            </>
                                        )}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-sm text-gray-500 space-y-1">
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4" />
                                        <span className={isOverdue ? "text-red-600 font-semibold" : ""}>
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
