"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, HelpCircle, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface AdminSidebarProps {
    userName?: string;
    className?: string;
}

export function AdminSidebar({ userName = "관리자", className }: AdminSidebarProps) {
    const pathname = usePathname();

    const menuItems = [
        { href: "/admin/students", label: "학생 관리", icon: Users },
    ];

    return (
        <aside className={cn("w-64 bg-white border-r border-gray-200 flex flex-col h-full shadow-sm", className)}>
            {/* Logo Section */}
            <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center">
                        <span className="text-xl font-bold text-white">M</span>
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-gray-900">MATHCLINIC</h1>
                        <p className="text-xs text-gray-500">LAB</p>
                    </div>
                </div>
            </div>

            {/* User Info */}
            <div className="p-4 border-b border-gray-200">
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">관리자</p>
                    <p className="text-sm font-semibold text-gray-900 truncate">{userName}</p>
                </div>
            </div>

            {/* Menu Items */}
            <nav className="flex-1 p-4 overflow-y-auto">
                <ul className="space-y-1">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname.startsWith(item.href);
                        return (
                            <li key={item.label}>
                                <Link
                                    href={item.href}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                                        isActive
                                            ? "bg-gray-900 text-white"
                                            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                    )}
                                >
                                    <Icon size={20} />
                                    <span>{item.label}</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-gray-200 space-y-2">
                <Dialog>
                    <DialogTrigger asChild>
                        <button
                            className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-colors"
                        >
                            <HelpCircle size={20} />
                            <span>Support</span>
                        </button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>고객 지원 및 계정 설정</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-6 py-4">
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <h3 className="font-bold text-sm mb-2 text-gray-900">내 계정 정보</h3>
                                <div className="space-y-1 text-sm text-gray-600">
                                    <p>이름: {userName}</p>
                                    <p>권한: 관리자</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h3 className="font-bold text-sm text-gray-900">문의하기</h3>
                                <p className="text-sm text-gray-600">
                                    시스템 이용 중 문제가 발생하거나 궁금한 점이 있으시면 아래 연락처로 문의해 주세요.
                                </p>
                                <div className="mt-2 text-sm">
                                    <p className="flex items-center gap-2 text-gray-700">
                                        <span className="font-semibold">Email:</span> support@mathclinic.com
                                    </p>
                                    <p className="flex items-center gap-2 text-gray-700">
                                        <span className="font-semibold">Tel:</span> 02-1234-5678
                                    </p>
                                </div>
                            </div>

                            <div className="bg-blue-50 p-4 rounded-lg text-xs text-blue-700">
                                <p>현재 버전: v2.2.0 (Latest)</p>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                <Link
                    href="/login"
                    className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-100 hover:text-red-600 rounded-lg transition-colors"
                >
                    <LogOut size={20} />
                    <span>로그아웃</span>
                </Link>
            </div>
        </aside>
    );
}
