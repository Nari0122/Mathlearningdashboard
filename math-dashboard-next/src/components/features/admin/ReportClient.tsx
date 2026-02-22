"use client";

import { Unit } from "@/types";
import { CheckCircle2, AlertTriangle, TrendingUp, Calendar, Zap } from "lucide-react";

interface LearningRecord {
    id: number;
    userId: number;
    date: string;
    progress: string;
    comment: string;
    createdBy: string;
}

interface ReportClientProps {
    units: Unit[];
    studentName: string;
    learningRecords: LearningRecord[];
}

export default function ReportClient({ units, studentName, learningRecords }: ReportClientProps) {
    // Calculate learning patterns from actual data
    const calculateLearningPatterns = () => {
        if (learningRecords.length === 0) {
            return {
                weeklyFrequency: '-',
                weeklyStatus: '-',
                weeklyColor: 'text-gray-600 bg-gray-50',
                maxGap: '-',
                maxGapStatus: '-',
                maxGapColor: 'text-gray-600 bg-gray-50',
                continuity: '-',
                continuityStatus: '-',
                continuityColor: 'text-gray-600 bg-gray-50'
            };
        }

        // Sort dates
        const dates = learningRecords.map(r => new Date(r.date)).sort((a, b) => a.getTime() - b.getTime());
        const uniqueDates = Array.from(new Set(dates.map(d => d.toISOString().split('T')[0])));

        // 1. Weekly Frequency: Total learning days / Total weeks
        const firstDate = new Date(uniqueDates[0]);
        const lastDate = new Date(uniqueDates[uniqueDates.length - 1]);
        const totalDays = Math.max(1, Math.ceil((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)));
        const totalWeeks = Math.max(1, totalDays / 7);
        const frequency = (uniqueDates.length / totalWeeks).toFixed(1);
        const freqNum = parseFloat(frequency);
        const weeklyStatus = freqNum >= 4 ? '우수' : freqNum >= 2 ? '양호' : '보통';
        const weeklyColor = freqNum >= 4 ? 'text-blue-600 bg-blue-50' : freqNum >= 2 ? 'text-green-600 bg-green-50' : 'text-orange-600 bg-orange-50';

        // 2. Max Gap: Longest period without learning
        let maxGapDays = 0;
        for (let i = 1; i < uniqueDates.length; i++) {
            const gap = Math.ceil((new Date(uniqueDates[i]).getTime() - new Date(uniqueDates[i - 1]).getTime()) / (1000 * 60 * 60 * 24));
            maxGapDays = Math.max(maxGapDays, gap);
        }
        const maxGapStatus = maxGapDays <= 3 ? '우수' : maxGapDays <= 7 ? '양호' : '주의';
        const maxGapColor = maxGapDays <= 3 ? 'text-blue-600 bg-blue-50' : maxGapDays <= 7 ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50';

        // 3. Continuity: Consecutive weeks with at least 1 learning session
        let currentStreak = 0;
        let maxStreak = 0;
        let currentWeekStart = new Date(uniqueDates[0]);
        currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay()); // Start of week

        const weekSet = new Set<string>();
        uniqueDates.forEach(dateStr => {
            const d = new Date(dateStr);
            const weekStart = new Date(d);
            weekStart.setDate(weekStart.getDate() - weekStart.getDay());
            weekSet.add(weekStart.toISOString().split('T')[0]);
        });

        const weeks = Array.from(weekSet).sort();
        currentStreak = 1;
        for (let i = 1; i < weeks.length; i++) {
            const prevWeek = new Date(weeks[i - 1] as string);
            const currWeek = new Date(weeks[i] as string);
            const daysDiff = (currWeek.getTime() - prevWeek.getTime()) / (1000 * 60 * 60 * 24);
            if (daysDiff <= 7) {
                currentStreak++;
            } else {
                maxStreak = Math.max(maxStreak, currentStreak);
                currentStreak = 1;
            }
        }
        maxStreak = Math.max(maxStreak, currentStreak);

        const continuityStatus = maxStreak >= 4 ? '우수' : maxStreak >= 2 ? '양호' : '보통';
        const continuityColor = maxStreak >= 4 ? 'text-blue-600 bg-blue-50' : maxStreak >= 2 ? 'text-green-600 bg-green-50' : 'text-orange-600 bg-orange-50';

        return {
            weeklyFrequency: `주 ${frequency}회`,
            weeklyStatus,
            weeklyColor,
            maxGap: `${maxGapDays}일`,
            maxGapStatus,
            maxGapColor,
            continuity: `${maxStreak}주 연속`,
            continuityStatus,
            continuityColor
        };
    };

    const stats = calculateLearningPatterns();
    const patterns = [
        { label: '주간 학습 빈도', value: stats.weeklyFrequency, status: stats.weeklyStatus, color: stats.weeklyColor },
        { label: '최대 학습 공백', value: stats.maxGap, status: stats.maxGapStatus, color: stats.maxGapColor },
        { label: '학습 지속성', value: stats.continuity, status: stats.continuityStatus, color: stats.continuityColor },
    ];

    // 1. Rule-based Improvement Points Generation
    const improvements = [];
    const totalErrors = units.reduce((acc, u) => ({
        C: acc.C + u.errors.C,
        M: acc.M + u.errors.M,
        R: acc.R + u.errors.R,
        S: acc.S + u.errors.S
    }), { C: 0, M: 0, R: 0, S: 0 });
    const totalCount = Object.values(totalErrors).reduce((a, b) => a + b, 0);

    if (totalCount > 0) {
        if (totalErrors.C / totalCount > 0.3) improvements.push("개념(C) 오답 비율이 높습니다. 기본 공식과 정의를 다시 정리하는 세션이 필요합니다.");
        if (totalErrors.M / totalCount > 0.3) improvements.push("계산(M) 실수가 잦습니다. 풀이 과정을 꼼꼼히 적는 연습을 지도해주세요.");
        if (totalErrors.R / totalCount > 0.3) improvements.push("독해(R) 오류가 보입니다. 문제의 조건을 밑줄 그으며 읽는 습관이 필요합니다.");
        if (totalErrors.S / totalCount > 0.3) improvements.push("전략(S) 수립에 어려움이 있습니다. 다양한 유형의 예제를 통해 접근법을 익혀야 합니다.");
    } else {
        improvements.push("오답 데이터가 충분하지 않습니다. 학습을 더 진행해주세요.");
    }

    const unfinishedHighUnits = units.filter(u => u.selectedDifficulty === '상' && u.completionStatus !== 'completed').length;
    if (unfinishedHighUnits > 0) {
        improvements.push(`'상' 난이도 단원 중 ${unfinishedHighUnits}개가 미완료 상태입니다. 심화 학습 보강이 권장됩니다.`);
    }

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-xl font-bold tracking-tight">종합 통계 리포트</h2>
                <p className="text-gray-500 mt-1">{studentName} 학생의 학습 패턴과 성취도를 분석한 리포트입니다.</p>
            </div>

            <div className="grid grid-cols-1 min-[510px]:grid-cols-3 gap-3">
                {patterns.map((p) => (
                    <div key={p.label} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between gap-2">
                        <div>
                            <p className="text-xs text-gray-500 mb-0.5">{p.label}</p>
                            <p className="text-base font-bold text-gray-900">{p.value}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${p.color}`}>
                            {p.status}
                        </span>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Improvement Points */}
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                        <Zap className="w-5 h-5 text-yellow-500" />
                        <h3 className="font-bold text-gray-900">AI 개선 포인트</h3>
                    </div>
                    <div className="p-6 flex-1">
                        <ul className="space-y-4">
                            {improvements.map((text, idx) => (
                                <li key={idx} className="flex gap-3 items-start">
                                    <CheckCircle2 className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                                    <span className="text-gray-700 leading-relaxed">{text}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Difficulty vs Achievement */}
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-blue-500" />
                        <h3 className="font-bold text-gray-900">난이도 vs 성취도 분석</h3>
                    </div>
                    <div className="p-6 flex-1">
                        <div className="space-y-4">
                            {/* Simple Comparison List */}
                            {units.slice(0, 5).map(u => (
                                <div key={u.id} className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-700 w-1/3 truncate">{u.name}</span>
                                    <div className="flex items-center gap-4 flex-1">
                                        {/* Difficulty Badge */}
                                        <div className="flex flex-col items-center">
                                            <span className="text-[10px] text-gray-400 mb-1">설정 난이도</span>
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${u.selectedDifficulty === '상' ? 'bg-red-100 text-red-700' :
                                                u.selectedDifficulty === '중' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {u.selectedDifficulty}
                                            </span>
                                        </div>
                                        <div className="h-px bg-gray-200 flex-1"></div>
                                        {/* Achievement Status */}
                                        <div className="flex flex-col items-center">
                                            <span className="text-[10px] text-gray-400 mb-1">실제 성취</span>
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${u.completionStatus === 'completed' ? 'bg-green-100 text-green-700' :
                                                u.completionStatus === 'in-progress' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'
                                                }`}>
                                                {u.completionStatus === 'completed' ? '완료됨' : '진행중'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {units.length === 0 && <p className="text-gray-400 text-center">데이터 없음</p>}
                        </div>
                    </div>
                </div>
            </div>

            {/* Note: Download button intentionally omitted as per requirement F */}
        </div>
    );
}
