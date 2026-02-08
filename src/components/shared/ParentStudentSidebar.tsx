"use client";

import Link from "next/link";
import {
    LayoutDashboard,
    BookOpen,
    Calendar,
    PenTool,
    ClipboardList,
    BarChart3,
    BookMarked,
    ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useParams, usePathname } from "next/navigation";

interface ParentStudentSidebarProps {
    studentName: string;
    /** URL 식별용. 있으면 /parent/[uid]/student 링크 사용 */
    parentUid?: string;
    className?: string;
}

export function ParentStudentSidebar({ studentName, parentUid, className }: ParentStudentSidebarProps) {
    const pathname = usePathname();
    const params = useParams();
    const studentId = params?.id as string;
    const uid = parentUid ?? (params?.uid as string);
    const BASE = uid ? `/parent/${uid}/student` : "/parent/student";

    if (!studentId) return null;

    const sidebarItems = [
        { icon: LayoutDashboard, label: "대시보드", href: `${BASE}/${studentId}` },
        { icon: BookOpen, label: "나의 학습", href: `${BASE}/${studentId}/learning` },
        { icon: BookMarked, label: "오답 노트", href: `${BASE}/${studentId}/incorrect-notes` },
        { icon: BarChart3, label: "시험 성적", href: `${BASE}/${studentId}/exams` },
        { icon: ClipboardList, label: "학습 기록", href: `${BASE}/${studentId}/history` },
        { icon: Calendar, label: "수업 일정", href: `${BASE}/${studentId}/schedule` },
        { icon: PenTool, label: "숙제 관리", href: `${BASE}/${studentId}/homework` },
    ];

    return (
        <div className={cn("w-64 bg-white border-r border-gray-200 flex flex-col h-full", className)}>
            <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center shrink-0">
                        <span className="text-xl font-bold text-white">M</span>
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-base font-bold text-gray-900 tracking-tight leading-tight">강나리 MATH LAB</h1>
                        <p className="text-xs text-gray-500 mt-0.5 font-normal">parent</p>
                    </div>
                </div>
                <p className="text-xs text-amber-600 font-medium mt-3 px-1">읽기 전용 (학부모 보기)</p>
            </div>
            <div className="p-4 flex-1">

                <div className="space-y-1">
                    {sidebarItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;

                        return (
                            <Link key={item.href} href={item.href}>
                                <Button
                                    variant="ghost"
                                    className={cn(
                                        "w-full justify-start gap-3 h-12 text-base font-medium",
                                        isActive
                                            ? "bg-blue-50 text-blue-600 hover:bg-blue-50 hover:text-blue-600"
                                            : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                                    )}
                                >
                                    <Icon className="w-5 h-5" />
                                    {item.label}
                                </Button>
                            </Link>
                        );
                    })}
                </div>
            </div>

            <div className="mt-auto p-4 border-t border-gray-200">
                <Link href={uid ? `/parent/${uid}/dashboard` : "/parent"}>
                    <Button variant="ghost" className="w-full justify-start gap-3 text-gray-500 hover:text-gray-900">
                        <ArrowLeft className="w-5 h-5" />
                        자녀 목록으로
                    </Button>
                </Link>
            </div>
        </div>
    );
}
