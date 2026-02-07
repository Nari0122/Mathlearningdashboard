"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const BASE = "/parent/student";

const tabs = [
    { href: (id: string) => `${BASE}/${id}`, label: "대시보드", exact: true },
    { href: (id: string) => `${BASE}/${id}/learning`, label: "나의 학습", exact: false },
    { href: (id: string) => `${BASE}/${id}/incorrect-notes`, label: "오답 노트", exact: false },
    { href: (id: string) => `${BASE}/${id}/exams`, label: "시험 성적", exact: false },
    { href: (id: string) => `${BASE}/${id}/history`, label: "학습 기록", exact: false },
    { href: (id: string) => `${BASE}/${id}/schedule`, label: "수업 일정", exact: false },
    { href: (id: string) => `${BASE}/${id}/homework`, label: "숙제 관리", exact: false },
];

interface ParentStudentLayoutClientProps {
    children: React.ReactNode;
    studentId: string;
    studentName: string;
}

export default function ParentStudentLayoutClient({
    children,
    studentId,
    studentName,
}: ParentStudentLayoutClientProps) {
    const pathname = usePathname();

    return (
        <div className="space-y-4">
            {/* Header: Back + Student Info (no 계정 관리) */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/parent/dashboard">
                        <Button variant="outline" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">{studentName} 학생</h1>
                        <p className="text-sm text-muted-foreground">읽기 전용 (학부모 보기)</p>
                    </div>
                </div>
            </div>

            {/* Top Tabs (same style as admin) */}
            <div className="border-b border-gray-200 overflow-x-auto scrollbar-hide">
                <nav className="-mb-px flex space-x-8 min-w-max px-4" aria-label="Tabs">
                    {tabs.map((tab) => {
                        const href = tab.href(studentId);
                        const isActive = tab.exact
                            ? pathname === href
                            : (pathname && pathname.startsWith(href));

                        return (
                            <Link
                                key={href}
                                href={href}
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
