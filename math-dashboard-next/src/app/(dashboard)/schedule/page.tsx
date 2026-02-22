"use client";

import { Calendar as CalendarIcon, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Mock Data
const CLASS_SESSIONS = [
    { id: 1, date: '2026-01-28', dayOfWeek: '화요일', startTime: '16:00', endTime: '18:00', status: 'scheduled', notes: '집합과 명제 복습' },
    { id: 2, date: '2026-01-21', dayOfWeek: '화요일', startTime: '16:00', endTime: '18:00', status: 'completed', notes: '함수 그래프 학습' }
];

const REGULAR_SCHEDULE = [{ id: 1, dayOfWeek: '화요일', startTime: '16:00', endTime: '18:00' }];

const DAY_ORDER = ["월요일", "화요일", "수요일", "목요일", "금요일", "토요일", "일요일"];

export default function SchedulePage() {
    const sortedRegularSchedules = [...REGULAR_SCHEDULE].sort((a, b) =>
        DAY_ORDER.indexOf(a.dayOfWeek) - DAY_ORDER.indexOf(b.dayOfWeek)
    );

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">수업 일정</h1>
                    <p className="text-gray-500 mt-1">정규 수업 및 보강 일정을 확인하세요.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Regular Schedule */}
                <div className="space-y-6">
                    <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="w-5 h-5" />
                                정규 수업 시간
                            </CardTitle>
                            <CardDescription className="text-white/80">고정된 주간 수업 시간입니다.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {sortedRegularSchedules.map(schedule => (
                                    <div key={schedule.id} className="bg-white/10 rounded-lg p-3 flex items-center justify-between backdrop-blur-sm">
                                        <span className="font-bold">{schedule.dayOfWeek}</span>
                                        <span className="font-medium">{schedule.startTime} - {schedule.endTime}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Upcoming & Past Sessions */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <CalendarIcon className="w-5 h-5 text-indigo-600" />
                            이번 달 수업 목록
                        </h2>

                        <div className="bg-white rounded-xl border shadow-sm">
                            {CLASS_SESSIONS.map((session, index) => (
                                <div key={session.id} className={`p-5 flex flex-col md:flex-row md:items-center gap-4 ${index !== CLASS_SESSIONS.length - 1 ? 'border-b' : ''}`}>
                                    {/* Date Box */}
                                    <div className="flex-shrink-0 bg-gray-50 rounded-lg p-3 text-center min-w-[80px]">
                                        <div className="text-xs text-gray-500">{format(new Date(session.date), 'yyyy년')}</div>
                                        <div className="text-lg font-bold text-gray-900">{format(new Date(session.date), 'M.d')}</div>
                                        <div className="text-xs font-medium text-gray-600">{session.dayOfWeek}</div>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <h3 className="font-semibold text-gray-900">{session.startTime} - {session.endTime}</h3>
                                            <Badge variant={session.status === 'completed' ? 'secondary' : 'default'} className={
                                                session.status === 'completed' ? 'bg-green-100 text-green-700 hover:bg-green-100' :
                                                    session.status === 'cancelled' ? 'bg-red-100 text-red-700 hover:bg-red-100' : 'bg-blue-100 text-blue-700 hover:bg-blue-100'
                                            }>
                                                {session.status === 'scheduled' ? '예정됨' :
                                                    session.status === 'completed' ? '수업 완료' :
                                                        session.status === 'cancelled' ? '취소됨' : session.status}
                                            </Badge>
                                        </div>
                                        {session.notes && (
                                            <p className="text-sm text-gray-600 bg-gray-50 rounded px-2 py-1 inline-block mt-1">
                                                {session.notes}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
