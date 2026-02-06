"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Calendar, Hash } from "lucide-react";

interface StudentStatsProps {
    stats: {
        recentLogin: string | null;
        nextClass: any | null;
        monthlyLoginCount: number;
        persistenceRate: number;
    } | null;
}

export function StudentStats({ stats }: StudentStatsProps) {
    if (!stats) return null;

    const formatDate = (dateUnparsed: string) => {
        if (!dateUnparsed) return "기록 없음";
        const date = new Date(dateUnparsed);
        return new Intl.DateTimeFormat('ko-KR', {
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric'
        }).format(date);
    };

    const formatSchedule = (schedule: any) => {
        if (!schedule) return "예정된 수업 없음";
        // Assuming schedule has date (YYYY-MM-DD) and startTime (HH:mm)
        const date = new Date(schedule.date);
        const dateStr = new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' }).format(date);
        return `${dateStr} ${schedule.startTime}`;
    };

    return (
        <div className="grid grid-cols-1 min-[510px]:grid-cols-3 gap-3 mb-4">
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between gap-1">
                <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">최근 접속 시간</p>
                    <Clock className="h-3 w-3 text-muted-foreground" />
                </div>
                <div>
                    <p className="text-sm font-bold text-gray-900">{formatDate(stats.recentLogin || "")}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">마지막 활동 시각</p>
                </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between gap-1">
                <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">다음 수업 일정</p>
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                </div>
                <div>
                    <p className="text-sm font-bold text-gray-900 tracking-tight">{formatSchedule(stats.nextClass)}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                        {stats.nextClass ? "잊지 말고 참석하세요!" : "일정이 잡히면 알려드릴게요"}
                    </p>
                </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between gap-1">
                <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">이번 달 접속</p>
                    <Hash className="h-3 w-3 text-muted-foreground" />
                </div>
                <div>
                    <p className="text-sm font-bold text-gray-900">{stats.monthlyLoginCount}회</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">꾸준한 학습이 중요합니다</p>
                </div>
            </div>
        </div>
    );
}
