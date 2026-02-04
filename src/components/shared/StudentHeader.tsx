"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LogOut } from "lucide-react";

export function StudentHeader({ studentName = "학생" }: { studentName?: string }) {
    const pathname = usePathname();

    const menuItems = [
        { href: "/dashboard", label: "대시보드" },
        { href: "/study/my-learning", label: "내 학습" },
        { href: "/schedule", label: "수업 일정" },
        { href: "/homework", label: "숙제" },
        { href: "/exams", label: "시험 성적" },
        { href: "/study/incorrect-notes", label: "오답노트" },
        { href: "/study/history", label: "학습 기록" },
    ];

    return (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
                {/* Logo */}
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                        <span className="text-lg font-bold text-white">M</span>
                    </div>
                    <span className="text-lg font-bold text-gray-900">MATHCLINIC</span>
                </div>

                {/* Desktop Tabs */}
                <nav className="hidden md:flex items-center gap-1 mx-6 overflow-x-auto no-scrollbar">
                    {menuItems.map((item) => {
                        const isActive = item.href === "/dashboard"
                            ? pathname === "/dashboard"
                            : (pathname && pathname.startsWith(item.href));

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap",
                                    isActive
                                        ? "bg-gray-900 text-white"
                                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                )}
                            >
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* User & Logout */}
                <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600 hidden sm:inline-block">{studentName} 님</span>
                    <Link
                        href="/login"
                        className="text-sm font-medium text-gray-500 hover:text-red-600 transition-colors"
                    >
                        로그아웃
                    </Link>
                </div>
            </div>

            {/* Mobile Tab Bar (Horizontal Scroll) */}
            <nav className="md:hidden flex items-center gap-2 px-4 py-2 border-t overflow-x-auto no-scrollbar">
                {menuItems.map((item) => {
                    const isActive = item.href === "/dashboard"
                        ? pathname === "/dashboard"
                        : (pathname && pathname.startsWith(item.href));
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap flex-shrink-0",
                                isActive
                                    ? "bg-gray-900 text-white"
                                    : "bg-gray-100 text-gray-600"
                            )}
                        >
                            {item.label}
                        </Link>
                    );
                })}
            </nav>
        </header>
    );
}
