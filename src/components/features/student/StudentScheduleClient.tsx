"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock, Hash } from "lucide-react";
import { cn } from "@/lib/utils";

interface StudentScheduleClientProps {
    schedules: any[];
}

export default function StudentScheduleClient({ schedules }: StudentScheduleClientProps) {
    // Sort schedules by date descending (already done by service likely, but ensure)
    // Actually user likely wants upcoming first?
    // Let's split into Upcoming and Past? Or just a chronological list.
    // Usually "Schedule" implies upcoming.

    // Sort by date descending for history, or ascending for upcoming?
    // Let's sort by date descending for now as per `getSchedules` default likely.

    const sortedSchedules = [...schedules].sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-700 hover:bg-green-100';
            case 'cancelled': return 'bg-red-100 text-red-700 hover:bg-red-100';
            case 'scheduled': return 'bg-blue-100 text-blue-700 hover:bg-blue-100';
            default: return 'bg-gray-100 text-gray-700 hover:bg-gray-100';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'completed': return '수업 완료';
            case 'cancelled': return '취소됨';
            case 'scheduled': return '예정됨';
            default: return status;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">수업 일정</h1>
                <span className="text-sm text-gray-500">총 {schedules.length}개의 일정</span>
            </div>

            <div className="space-y-3">
                {sortedSchedules.map((schedule) => (
                    <Card key={schedule.id} className="overflow-hidden hover:shadow-md transition-shadow">
                        <CardContent className="p-0">
                            <div className="flex flex-col md:flex-row md:items-center">
                                {/* Date Section */}
                                <div className="bg-blue-50/50 p-4 md:w-48 flex flex-col justify-center items-center text-center border-b md:border-b-0 md:border-r border-blue-100">
                                    <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">Date</span>
                                    <div className="text-xl font-bold text-gray-900">
                                        {new Date(schedule.date).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}
                                    </div>
                                    <div className="text-sm text-gray-500 font-medium mt-1">
                                        {new Date(schedule.date).toLocaleDateString('ko-KR', { weekday: 'long' })}
                                    </div>
                                </div>

                                {/* Content Section */}
                                <div className="flex-1 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Badge className={cn("rounded-md px-2.5 py-0.5", getStatusColor(schedule.status))} variant="secondary">
                                                {getStatusLabel(schedule.status)}
                                            </Badge>
                                            {schedule.sessionNumber && (
                                                <div className="flex items-center text-sm font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-md">
                                                    <Hash className="w-3 h-3 mr-1 text-gray-500" />
                                                    {schedule.sessionNumber}회차 수업
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-6 text-sm text-gray-600">
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-blue-500" />
                                                <span className="font-medium text-gray-900">{schedule.startTime} - {schedule.endTime}</span>
                                            </div>
                                            {schedule.isRegular && (
                                                <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-100">
                                                    정규 수업
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {schedules.length === 0 && (
                    <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <CalendarDays className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                        <h3 className="text-lg font-medium text-gray-900">등록된 일정이 없습니다</h3>
                        <p className="text-sm text-gray-500 mt-1">새로운 수업 일정이 등록되면 여기에 표시됩니다.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
