"use client";

import { StudentStats } from "@/components/features/student/StudentStats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, ClipboardList, BookOpen } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

interface AdminStudentDashboardClientProps {
    initialUnits: any[];
    stats: {
        recentLogin: string | null;
        nextClass: any | null;
        monthlyLoginCount: number;
        persistenceRate: number;
    } | null;
    recentAssignments?: any[];
    recentRecords?: any[];
    studentDocId: string;
}

export default function AdminStudentDashboardClient({ stats, recentAssignments = [], recentRecords = [], studentDocId }: AdminStudentDashboardClientProps) {
    return (
        <div className="space-y-8">
            {/* Student Activity Stats (from Student Page) */}
            <StudentStats stats={stats} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Homework for Admin */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <ClipboardList className="h-5 w-5 text-blue-600" />
                            최근 내준 숙제
                        </CardTitle>
                        <Link href={`/admin/students/${studentDocId}/homework`} className="text-xs text-muted-foreground flex items-center hover:text-blue-600">
                            상세보기 <ChevronRight className="h-3 w-3" />
                        </Link>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentAssignments.length > 0 ? (
                                recentAssignments.map((a) => {
                                    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' });
                                    const isOverdue = today > a.dueDate && a.status !== 'submitted' && a.status !== 'late-submitted';

                                    return (
                                        <div key={a.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                            <div className="space-y-1">
                                                <p className="text-sm font-medium leading-none">{a.title}</p>
                                                <p className="text-xs text-muted-foreground">마감: {formatDate(a.dueDate)}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge
                                                    variant={a.status === 'submitted' ? "default" : a.status === 'late-submitted' ? "destructive" : "outline"}
                                                    className={
                                                        a.status === 'submitted' ? "bg-green-600" :
                                                            a.status === 'late-submitted' ? "bg-yellow-500 hover:bg-yellow-600" : ""
                                                    }
                                                >
                                                    {a.status === 'submitted' ? '완료' :
                                                        a.status === 'late-submitted' ? '지각제출' : '미완료'}
                                                </Badge>
                                                {isOverdue && (
                                                    <Badge variant="destructive" className="bg-red-600">
                                                        마감됨
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <p className="text-sm text-center py-4 text-muted-foreground">최근 숙제가 없습니다.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Recent History for Admin */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-purple-600" />
                            최근 학습 기록
                        </CardTitle>
                        <Link href={`/admin/students/${studentDocId}/history`} className="text-xs text-muted-foreground flex items-center hover:text-purple-600">
                            상세보기 <ChevronRight className="h-3 w-3" />
                        </Link>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentRecords.length > 0 ? (
                                recentRecords.map((r) => (
                                    <div key={r.id} className="p-3 bg-gray-50 rounded-lg space-y-2 hover:bg-gray-100 transition-colors">
                                        <div className="flex justify-between items-start">
                                            <p className="text-xs font-semibold text-purple-700">{r.progress}</p>
                                            <span className="text-[10px] text-muted-foreground">{formatDate(r.date)}</span>
                                        </div>
                                        <p className="text-xs text-gray-600 line-clamp-1">{r.comment || "학습 기록 내용이 없습니다."}</p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-center py-4 text-muted-foreground">최근 학습 기록이 없습니다.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
