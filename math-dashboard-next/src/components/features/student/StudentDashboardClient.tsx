"use client";

import { StudentStats } from "@/components/features/student/StudentStats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, ClipboardList, BookOpen, Camera } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { formatDate } from "@/lib/utils";
import { isSubmissionLocked } from "@/lib/submissionDeadline";
import { isPastReviewDeadline } from "@/lib/reviewSubmissionDeadline";
import { HomeworkDeadlineCountdown } from "@/components/shared/HomeworkDeadlineCountdown";
import { ReviewDeadlineCountdownText } from "@/components/shared/ReviewDeadlineCountdownText";
import type { ReviewProblem } from "@/types/review-submission";

const PROGRESS_MAP: Record<string, { label: string; color: string }> = {
    none: { label: "안 함", color: "bg-red-100 text-red-700" },
    little: { label: "조금", color: "bg-orange-100 text-orange-700" },
    half: { label: "절반", color: "bg-yellow-100 text-yellow-700" },
    almost: { label: "거의 다", color: "bg-lime-100 text-lime-700" },
    done: { label: "완료", color: "bg-green-100 text-green-700" },
};

interface StudentDashboardClientProps {
    initialUnits?: any[];
    stats?: any | null;
    recentAssignments?: any[];
    recentRecords?: any[];
    recentReviewProblems?: ReviewProblem[];
    /** 학부모 읽기 전용 시 링크 경로 (예: /parent/student) */
    basePath?: string;
}

export default function StudentDashboardClient({
    stats,
    recentAssignments = [],
    recentRecords = [],
    recentReviewProblems = [],
    basePath = "/student",
}: StudentDashboardClientProps) {
    const params = useParams();
    const id = (params?.id as string) || "";

    return (
        <div className="space-y-8">
            {/* Stats Section */}
            {stats && <StudentStats stats={stats} />}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Homework */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <ClipboardList className="h-5 w-5 text-blue-600" />
                            최근 내준 숙제
                        </CardTitle>
                        <Link href={`${basePath}/${id}/homework`} className="text-xs text-muted-foreground flex items-center hover:text-blue-600">
                            더보기 <ChevronRight className="h-3 w-3" />
                        </Link>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentAssignments.length > 0 ? (
                                recentAssignments.map((a) => {
                                    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' });
                                    const notSubmitted = a.status !== 'submitted' && a.status !== 'late-submitted';
                                    const pastDeadline =
                                        a.status === "expired" ||
                                        a.status === "overdue" ||
                                        (notSubmitted && (today > a.dueDate || isSubmissionLocked(a)));
                                    const prog = PROGRESS_MAP[a.progress] || PROGRESS_MAP.none;

                                    return (
                                        <div key={a.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                            <div className="space-y-1">
                                                <p className="text-sm font-medium leading-none">{a.title}</p>
                                                <p className="text-xs text-muted-foreground">마감: {formatDate(a.dueDate)}</p>
                                                <HomeworkDeadlineCountdown
                                                    dueDate={a.dueDate}
                                                    submissionDeadline={a.submissionDeadline}
                                                    linkedScheduleId={a.linkedScheduleId}
                                                    className="text-[11px] block mt-0.5"
                                                />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className={prog.color}>
                                                    {prog.label}
                                                </Badge>
                                                {pastDeadline && (
                                                    <Badge variant="destructive" className="bg-red-600">
                                                        기한 초과
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

                {/* Recent History */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-purple-600" />
                            최근 학습 기록
                        </CardTitle>
                        <Link href={`${basePath}/${id}/history`} className="text-xs text-muted-foreground flex items-center hover:text-purple-600">
                            더보기 <ChevronRight className="h-3 w-3" />
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

                {/* Recent review submission */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <Camera className="h-5 w-5 text-emerald-600" />
                            복습 제출
                        </CardTitle>
                        <Link href={`${basePath}/${id}/review-submission`} className="text-xs text-muted-foreground flex items-center hover:text-emerald-600">
                            더보기 <ChevronRight className="h-3 w-3" />
                        </Link>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentReviewProblems.length > 0 ? (
                                recentReviewProblems.map((p) => {
                                    const title = p.bookAndProblem?.trim() || p.unitName?.trim() || "복습 문제";
                                    const submitted = Boolean(p.submittedAt);
                                    const past = p.deadline ? isPastReviewDeadline(p.deadline) : false;
                                    const hasFeedback = Boolean(p.feedback?.trim());

                                    return (
                                        <div key={p.id} className="flex items-center justify-between gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                            <div className="space-y-1 min-w-0 flex-1">
                                                <p className="text-sm font-medium leading-none line-clamp-2">{title}</p>
                                                {p.deadline ? (
                                                    <>
                                                        <p className="text-xs text-muted-foreground">마감: {formatDate(p.deadline)}</p>
                                                        <ReviewDeadlineCountdownText deadlineIso={p.deadline} className="text-[11px] block mt-0.5" />
                                                    </>
                                                ) : (
                                                    <p className="text-xs text-muted-foreground">마감 일정 없음</p>
                                                )}
                                            </div>
                                            <div className="flex flex-col items-end gap-1 shrink-0">
                                                {submitted ? (
                                                    <Badge variant="outline" className={p.isLateSubmit ? "bg-orange-100 text-orange-800 border-orange-200" : "bg-green-100 text-green-800 border-green-200"}>
                                                        {p.isLateSubmit ? "지각 제출" : "제출 완료"}
                                                    </Badge>
                                                ) : past ? (
                                                    <Badge variant="destructive" className="bg-red-600">
                                                        기한 초과
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="bg-slate-100 text-slate-700">
                                                        제출 전
                                                    </Badge>
                                                )}
                                                {hasFeedback && (
                                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 border-violet-200 text-violet-700 bg-violet-50">
                                                        피드백
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <p className="text-sm text-center py-4 text-muted-foreground">등록된 복습 문제가 없습니다.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
