"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface StudentDetailLayoutClientProps {
    children: React.ReactNode;
    studentDocId: string;
    studentName: string;
    student: any;
}

export default function StudentDetailLayoutClient({
    children,
    studentDocId,
    studentName,
    student,
}: StudentDetailLayoutClientProps) {
    const pathname = usePathname();

    const tabs = [
        { href: `/admin/students/${studentDocId}`, label: "대시보드", exact: true },
        { href: `/admin/students/${studentDocId}/analysis`, label: "오답 분석" },
        { href: `/admin/students/${studentDocId}/report`, label: "통계 리포트" },
        { href: `/admin/students/${studentDocId}/history`, label: "학습 기록" },
        { href: `/admin/students/${studentDocId}/schedule`, label: "수업 일정" },
        { href: `/admin/students/${studentDocId}/homework`, label: "숙제 관리" },
        { href: `/admin/students/${studentDocId}/review-submission`, label: "복습 제출" },
        { href: `/admin/students/${studentDocId}/exams`, label: "시험 성적" },
        { href: `/admin/students/${studentDocId}/incorrect-notes`, label: "오답 노트" },
        { href: `/admin/students/${studentDocId}/account`, label: "계정" },
    ];

    return (
        <div className="space-y-4">
            {/* Header with Back Button and Student Info */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 md:gap-4 min-w-0">
                    <Link href="/admin/students">
                        <Button variant="outline" size="icon" className="min-h-[44px] min-w-[44px] shrink-0">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div className="min-w-0">
                        <h1 className="text-lg md:text-2xl font-bold tracking-tight truncate">{studentName} 학생</h1>
                        <p className="text-xs md:text-sm text-muted-foreground">학생 상세 정보 및 학습 관리</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 overflow-x-auto scrollbar-hide -mx-4 md:mx-0 px-4 md:px-0">
                <nav className="-mb-px flex space-x-4 md:space-x-8 min-w-max" aria-label="Tabs">
                    {tabs.map((tab) => {
                        const isActive = tab.exact
                            ? pathname === tab.href
                            : (pathname && pathname.startsWith(tab.href));

                        return (
                            <Link
                                key={tab.href}
                                href={tab.href}
                                className={cn(
                                    "whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors min-h-[44px] flex items-center",
                                    isActive
                                        ? "border-blue-500 text-blue-600"
                                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                )}
                            >
                                {tab.label}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* Content - 상단 여백 최소화 (탭과 페이지 제목 사이) */}
            <div className="pt-2 pb-4">
                {children}
            </div>
        </div>
    );
}
