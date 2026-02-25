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
        { href: `/admin/students/${studentDocId}/learning`, label: "나의 학습" },
        { href: `/admin/students/${studentDocId}/analysis`, label: "오답 분석" },
        { href: `/admin/students/${studentDocId}/report`, label: "통계 리포트" },
        { href: `/admin/students/${studentDocId}/history`, label: "학습 기록" },
        { href: `/admin/students/${studentDocId}/schedule`, label: "수업 일정" },
        { href: `/admin/students/${studentDocId}/homework`, label: "숙제 관리" },
        { href: `/admin/students/${studentDocId}/exams`, label: "시험 성적" },
        { href: `/admin/students/${studentDocId}/incorrect-notes`, label: "오답 노트" },
        { href: `/admin/students/${studentDocId}/account`, label: "계정" },
    ];

    return (
        <div className="space-y-4">
            {/* Header with Back Button and Student Info */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/students">
                        <Button variant="outline" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">{studentName} 학생</h1>
                        <p className="text-sm text-muted-foreground">학생 상세 정보 및 학습 관리</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 overflow-x-auto scrollbar-hide">
                <nav className="-mb-px flex space-x-8 min-w-max px-4" aria-label="Tabs">
                    {tabs.map((tab) => {
                        const isActive = tab.exact
                            ? pathname === tab.href
                            : (pathname && pathname.startsWith(tab.href));

                        return (
                            <Link
                                key={tab.href}
                                href={tab.href}
                                className={cn(
                                    "whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors",
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
