"use client";

import { ClipboardList } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface StudentHistoryClientProps {
    records: any[];
    studentDocId?: string;
}

export default function StudentHistoryClient({ records }: StudentHistoryClientProps) {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-[#F0F3FF]">
                    <ClipboardList className="w-6 h-6 text-[#5D00E2]" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-[#2F3438]">학습 기록 조회</h2>
                    <p className="text-sm text-[#6C727A] mt-0.5">지금까지의 학습 히스토리와 선생님의 피드백을 확인하세요.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {records.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                        <ClipboardList className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                        <p className="text-gray-500 font-medium">등록된 학습 기록이 없습니다.</p>
                    </div>
                ) : (
                    records.map((record: any) => (
                        <div key={record.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <div className="flex items-center gap-2">
                                        {record.sessionNumber && (
                                            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{record.sessionNumber}회차</span>
                                        )}
                                        <h3 className="font-bold text-lg text-gray-900">{record.progress}</h3>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider ${record.createdBy === 'student'
                                            ? 'bg-blue-100 text-blue-700'
                                            : 'bg-purple-100 text-purple-700'
                                            }`}>
                                            {record.createdBy === 'student' ? '내 기록' : '선생님 코멘트'}
                                        </span>
                                        <span className="text-sm text-gray-400 font-medium">{formatDate(record.date)}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                <p className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed">{record.comment || "코멘트가 없습니다."}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
