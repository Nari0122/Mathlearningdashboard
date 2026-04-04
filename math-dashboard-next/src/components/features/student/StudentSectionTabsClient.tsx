"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const tabs = (base: string) =>
    [
        { href: base, label: "대시보드", exact: true },
        { href: `${base}/incorrect-notes`, label: "오답 노트", exact: false },
        { href: `${base}/exams`, label: "시험 성적", exact: false },
        { href: `${base}/history`, label: "학습 기록", exact: false },
        { href: `${base}/schedule`, label: "수업 일정", exact: false },
        { href: `${base}/homework`, label: "숙제 관리", exact: false },
        { href: `${base}/review-submission`, label: "복습 제출", exact: false },
        { href: `${base}/links`, label: "연동 관리", exact: false },
    ] as const;

export default function StudentSectionTabsClient({
    studentDocId,
    children,
}: {
    studentDocId: string;
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const base = `/student/${studentDocId}`;

    return (
        <div className="space-y-4">
            <div className="border-b border-gray-200 overflow-x-auto scrollbar-hide -mx-4 md:-mx-8 px-4 md:px-8">
                <nav className="-mb-px flex space-x-4 md:space-x-8 min-w-max" aria-label="학생 메뉴">
                    {tabs(base).map((tab) => {
                        const isActive = tab.exact
                            ? pathname === tab.href
                            : Boolean(pathname && pathname.startsWith(tab.href));

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
            <div className="pt-0">{children}</div>
        </div>
    );
}
