"use client";

import { ClipboardList, User, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

// Mock Data
const LEARNING_RECORDS = [
    {
        id: 1,
        date: '2026-01-12',
        progress: '집합과 명제 3-2단원 완료',
        comment: '개념 이해도 우수. 다음 시간 문제 풀이 예정.',
        createdBy: 'admin'
    },
    {
        id: 2,
        date: '2026-01-11',
        progress: '함수 1-1단원 학습',
        comment: '함수 그래프 그리기 연습 필요. 숙제: 연습문제 5개',
        createdBy: 'admin'
    },
    {
        id: 3,
        date: '2026-01-10',
        progress: '방정식과 부등식 복습',
        comment: '이차방정식 실수 줄어듦. 잘하고 있음!',
        createdBy: 'admin'
    }
];

export default function LearningHistoryPage() {
    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                    <ClipboardList size={20} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">학습 기록</h1>
                    <p className="text-gray-500 text-sm">선생님이 작성해주신 학습 피드백입니다.</p>
                </div>
            </div>

            <div className="relative border-l-2 border-gray-200 ml-4 space-y-12">
                {LEARNING_RECORDS.map((record) => (
                    <div key={record.id} className="relative pl-8">
                        {/* Timeline Dot */}
                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-4 border-indigo-500"></div>

                        {/* Date Header */}
                        <div className="flex items-center text-sm font-semibold text-indigo-600 mb-2">
                            <CalendarIcon size={14} className="mr-2" />
                            {format(new Date(record.date), 'PPP (EEEE)', { locale: ko })}
                        </div>

                        {/* Card Content */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                            <h3 className="text-lg font-bold text-gray-900 mb-2">{record.progress}</h3>
                            <p className="text-gray-700 leading-relaxed mb-4 whitespace-pre-line">
                                {record.comment}
                            </p>

                            <div className="flex items-center gap-2 border-t pt-4 mt-2">
                                <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                                    <User size={12} className="text-gray-500" />
                                </div>
                                <span className="text-xs text-gray-500">
                                    작성자: {record.createdBy === 'admin' ? '선생님' : '학생'}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {LEARNING_RECORDS.length === 0 && (
                <div className="text-center py-20">
                    <p className="text-gray-500">아직 등록된 학습 기록이 없습니다.</p>
                </div>
            )}
        </div>
    );
}
