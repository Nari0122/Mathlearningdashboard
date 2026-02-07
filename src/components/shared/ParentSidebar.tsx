"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { LayoutDashboard, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

interface ParentSidebarProps {
    userName?: string;
    className?: string;
}

export function ParentSidebar({ userName = "학부모", className }: ParentSidebarProps) {
    const pathname = usePathname();
    const { data: session } = useSession();
    const displayName = session?.user?.name ?? userName;

    const menuItems = [
        { href: "/parent/dashboard", label: "자녀 목록", icon: LayoutDashboard },
    ];

    return (
        <aside className={cn("w-64 bg-white border-r border-gray-200 flex flex-col h-full shadow-sm", className)}>
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
            </div>

            <div className="p-4 border-b border-gray-200">
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">parent</p>
                    <p className="text-sm font-semibold text-gray-900 truncate">{displayName}</p>
                </div>
            </div>

            <nav className="flex-1 p-4 overflow-y-auto">
                <ul className="space-y-1">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href || (item.href !== "/parent/dashboard" && pathname?.startsWith(item.href));
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

            <div className="p-4 border-t border-gray-200">
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
