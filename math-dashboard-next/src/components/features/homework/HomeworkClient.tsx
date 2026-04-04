"use client";

import { FileText, CheckCircle2, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { updateHomeworkStatus } from "@/actions/homework-actions";
import { useState } from "react";

// Define based on Firestore document structure
type Homework = {
    id: string;
    title: string;
    description: string | null;
    assignedDate: string;
    dueDate: string;
    status: string;
    feedback: string | null;
};

interface HomeworkClientProps {
    initialHomeworks: Homework[];
    studentDocId: string;
}

export default function HomeworkClient({ initialHomeworks, studentDocId }: HomeworkClientProps) {
    const [homeworks, setHomeworks] = useState<Homework[]>(initialHomeworks);
    const [isUpdating, setIsUpdating] = useState<string | null>(null);

    const handleStatusToggle = async (id: string, currentStatus: string) => {
        if (isUpdating === id) return;

        const newStatus = currentStatus === 'submitted' ? 'pending' : 'submitted';
        setIsUpdating(id);

        try {
            // Optimistic Update
            setHomeworks(prev => prev.map(hw =>
                hw.id === id ? { ...hw, status: newStatus } : hw
            ));

            await updateHomeworkStatus(studentDocId, id, newStatus);
        } catch (error) {
            console.error("Failed to update status", error);
            // Revert on error
            setHomeworks(prev => prev.map(hw =>
                hw.id === id ? { ...hw, status: currentStatus } : hw
            ));
        } finally {
            setIsUpdating(null);
        }
    };

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6 md:space-y-8">
            <div>
                <h1 className="text-xl md:text-2xl font-bold tracking-tight">수업 숙제</h1>
                <p className="text-gray-500 mt-1 text-sm">부여된 숙제 목록과 피드백을 확인하세요.</p>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {homeworks.length > 0 ? (
                    homeworks.map((hw) => (
                        <div key={hw.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                            <div className="p-4 md:p-6">
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4 mb-4">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${hw.status === 'submitted' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                                            <FileText size={20} />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-bold text-base md:text-lg text-gray-900 truncate">{hw.title}</h3>
                                            <p className="text-sm text-gray-500 truncate">{hw.description}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center sm:flex-col sm:items-end gap-2 ml-auto">
                                        <Badge variant={hw.status === 'submitted' ? 'secondary' : 'default'} className={hw.status === 'submitted' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}>
                                            {hw.status === 'submitted' ? '제출 완료' : '진행 중'}
                                        </Badge>

                                        <Button
                                            size="sm"
                                            variant={hw.status === 'submitted' ? "outline" : "default"}
                                            onClick={() => handleStatusToggle(hw.id, hw.status)}
                                            disabled={isUpdating === hw.id}
                                            className={`min-h-[44px] ${hw.status === 'submitted' ? "text-red-500 hover:text-red-700 hover:bg-red-50 border-red-200" : ""}`}
                                        >
                                            {isUpdating === hw.id ? "처리 중..." : (hw.status === 'submitted' ? "제출 취소" : "완료하기")}
                                        </Button>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-4 border-t border-gray-100 gap-4">
                                    <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
                                        <div>
                                            <span className="text-gray-500 mr-2">부여일:</span>
                                            <span className="font-medium text-gray-900">{hw.assignedDate}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500 mr-2">마감일:</span>
                                            <span className="font-medium text-red-600">{hw.dueDate}</span>
                                        </div>
                                    </div>

                                    {hw.feedback ? (
                                        <div className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded text-sm font-medium">
                                            선생님 피드백: {hw.feedback}
                                        </div>
                                    ) : (
                                        <div className="text-xs text-gray-400">
                                            아직 피드백이 없습니다.
                                        </div>
                                    )}
                                </div>
                                {(hw as any).isLateUpdate && (hw as any).lastModifiedDate && (
                                    <div className="mt-2 text-xs text-amber-600">
                                        ⚠️ 마감 후 수정됨 · 마지막 수정: {new Date((hw as any).lastModifiedDate).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}
                                    </div>
                                )}
                            </div>
                            {/* Progress Bar for visual flair */}
                            <div className={`h-1.5 w-full ${hw.status === 'submitted' ? 'bg-green-500' : 'bg-orange-300'}`} />
                        </div>
                    ))
                ) : (
                    <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
                        <p className="text-gray-500">등록된 숙제가 없습니다.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
