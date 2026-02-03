"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Calendar, Hash, Activity } from "lucide-react";

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">최근 접속 시간</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-sm">{formatDate(stats.recentLogin || "")}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                        마지막 활동 시각
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">다음 수업 일정</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-sm tracking-tight">{formatSchedule(stats.nextClass)}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                        {stats.nextClass ? "잊지 말고 참석하세요!" : "일정이 잡히면 알려드릴게요"}
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">이번 달 접속</CardTitle>
                    <Hash className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.monthlyLoginCount}회</div>
                    <p className="text-xs text-muted-foreground mt-1">
                        꾸준한 학습이 중요합니다
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">학습 지속율</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.persistenceRate}%</div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                        <div
                            className="bg-blue-600 h-1.5 rounded-full"
                            style={{ width: `${stats.persistenceRate}%` }}
                        ></div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
