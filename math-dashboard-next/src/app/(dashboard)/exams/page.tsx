"use client";

import { TrendingUp, Award, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const EXAM_RECORDS = [
    { id: 1, examType: '중간고사', subject: '수학', date: '2026-01-10', score: 85, maxScore: 100, notes: '실수가 좀 있었음' },
    { id: 2, examType: '기말고사', subject: '수학', date: '2025-12-20', score: 78, maxScore: 100, notes: '함수 파트 약함' }
];

export default function ExamsPage() {
    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">시험 성적</h1>
                <p className="text-gray-500 mt-1">모의고사 및 정규 시험 성적 추이를 확인하세요.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {EXAM_RECORDS.map(exam => (
                    <div key={exam.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all">
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <Badge variant="outline" className="text-indigo-600 border-indigo-200 bg-indigo-50">
                                    {exam.examType}
                                </Badge>
                                <span className="text-sm text-gray-400">{exam.date}</span>
                            </div>

                            <div className="text-center py-4">
                                <div className="text-5xl font-bold text-gray-900 mb-1">{exam.score}</div>
                                <div className="text-sm text-gray-500">/ {exam.maxScore}점</div>
                            </div>

                            {exam.notes && (
                                <div className="mt-4 bg-gray-50 rounded-lg p-3 text-sm text-gray-600 flex gap-2">
                                    <AlertCircle size={16} className="text-gray-400 shrink-0 mt-0.5" />
                                    {exam.notes}
                                </div>
                            )}
                        </div>
                        {/* Score Bar */}
                        <div className="bg-gray-100 h-2 w-full">
                            <div
                                className={`h-full ${exam.score >= 90 ? 'bg-green-500' : exam.score >= 80 ? 'bg-blue-500' : 'bg-yellow-500'}`}
                                style={{ width: `${(exam.score / exam.maxScore!) * 100}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
