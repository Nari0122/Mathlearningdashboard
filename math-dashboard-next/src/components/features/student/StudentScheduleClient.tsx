"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock, Calendar } from "lucide-react";

interface StudentScheduleClientProps {
    schedules: any[];
}

const DAYS = ["월요일", "화요일", "수요일", "목요일", "금요일", "토요일", "일요일"];

export default function StudentScheduleClient({ schedules }: StudentScheduleClientProps) {
    // Split schedules into regular and sessions
    const regularSchedules = schedules
        .filter((s: any) => s.isRegular)
        .sort((a: any, b: any) => DAYS.indexOf(a.dayOfWeek) - DAYS.indexOf(b.dayOfWeek));
    const sessions = schedules
        .filter((s: any) => !s.isRegular)
        .sort((a: any, b: any) => (b.date || "").localeCompare(a.date || "") || (b.startTime || "").localeCompare(a.startTime || ""));

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-[#F0F3FF]">
                    <Calendar className="w-6 h-6 text-[#5D00E2]" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-[#2F3438]">수업 일정</h1>
                    <p className="text-sm text-[#6C727A] mt-0.5">정규 수업과 수업 일정을 확인하세요.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Card: Regular Schedule */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm text-gray-500">정규 수업 ({regularSchedules.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {regularSchedules.length === 0 ? (
                            <p className="text-sm text-gray-400">설정된 정규 일정이 없습니다.</p>
                        ) : (
                            regularSchedules.map((s: any) => (
                                <div key={s.id} className="flex justify-between items-center p-3 bg-gray-50 rounded mb-2">
                                    <span className="font-bold text-gray-700">{s.dayOfWeek}</span>
                                    <span className="font-medium text-gray-900">{s.startTime} - {s.endTime}</span>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>

                {/* Right Card: Session History */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm text-gray-500">최근 수업 내역</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {sessions.length === 0 ? (
                            <p className="text-sm text-gray-400">수업 내역이 없습니다.</p>
                        ) : (
                            sessions.map((s: any) => {
                                const isModified = s.isModified || s.status === "POSTPONED" || s.status === "CHANGED" || s.status === "CANCELLED";
                                const hasChangeBadge = s.scheduleChangeType;
                                return (
                                    <div key={s.id} className={`flex justify-between items-center p-3 border-b last:border-0 ${isModified ? "opacity-70" : ""}`}>
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                {hasChangeBadge && (
                                                    <Badge className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-full text-xs">
                                                        {s.scheduleChangeType}
                                                    </Badge>
                                                )}
                                                <div className={isModified ? "line-through text-gray-500" : "font-bold"}>{s.date}</div>
                                                {s.sessionNumber && (
                                                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                                        {s.sessionNumber}회차
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-xs text-gray-400 mt-1">
                                                {(() => {
                                                    if (s.status === "CANCELLED") return "취소됨";
                                                    if (s.status === "POSTPONED") return "연기됨";
                                                    if (s.status === "CHANGED") return "일정 변경됨";
                                                    const scheduleEnd = new Date(`${s.date}T${s.endTime}`);
                                                    const now = new Date();
                                                    const isPassed = now > scheduleEnd;
                                                    if (s.status === "cancelled") return "취소됨";
                                                    if (s.status === "completed" || isPassed) return "수업 완료";
                                                    if (s.status === "scheduled") return "예정됨";
                                                    return s.status;
                                                })()}
                                            </div>
                                        </div>
                                        <span className={`text-sm ${isModified ? "line-through text-gray-500" : "text-gray-600"}`}>{s.startTime} - {s.endTime}</span>
                                    </div>
                                );
                            })
                        )}
                    </CardContent>
                </Card>
            </div>

            {schedules.length === 0 && (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <CalendarDays className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                    <h3 className="text-lg font-medium text-gray-900">등록된 일정이 없습니다</h3>
                    <p className="text-sm text-gray-500 mt-1">새로운 수업 일정이 등록되면 여기에 표시됩니다.</p>
                </div>
            )}
        </div>
    );
}
