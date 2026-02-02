"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, HelpCircle, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

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
                <button
                    className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-colors"
                >
                    <HelpCircle size={20} />
                    <span>Support</span>
                </button>
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
