"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { LayoutDashboard, LogOut, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { getSystemSettings } from "@/actions/system-actions";

interface ParentSidebarProps {
    userName?: string;
    /** URL 식별용. 있으면 /parent/[uid]/dashboard 형태 링크 사용 */
    parentUid?: string;
    className?: string;
}

export function ParentSidebar({ userName, parentUid, className }: ParentSidebarProps) {
    const pathname = usePathname();
    const { data: session } = useSession();
    const displayName = userName?.trim() || session?.user?.name || "학부모";
    const [settings, setSettings] = useState({ supportEmail: "support@mathclinic.com", supportPhone: "02-1234-5678" });

    useEffect(() => {
        getSystemSettings().then(setSettings);
    }, []);

    const base = parentUid ? `/parent/${parentUid}` : "/parent/dashboard";
    const menuItems = [
        { href: `${base}/dashboard`, label: "자녀 목록", icon: LayoutDashboard },
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

            <nav className="flex-1 min-h-0 p-4 overflow-y-auto">
                <ul className="space-y-1">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href || (item.href !== `${base}/dashboard` && pathname?.startsWith(item.href));
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

            <div className="p-4 border-t border-gray-200 space-y-2 shrink-0">
                <Link
                    href="/login"
                    className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-100 hover:text-red-600 rounded-lg transition-colors"
                >
                    <LogOut size={20} />
                    <span>로그아웃</span>
                </Link>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="ghost" className="w-full justify-start gap-3 text-gray-500 hover:text-gray-900">
                            <HelpCircle className="w-5 h-5" />
                            Support
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>학부모 지원 및 계정 정보</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-6 py-4">
                            <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                                <h3 className="font-bold text-sm mb-2 text-blue-900">내 정보</h3>
                                <div className="space-y-1 text-sm text-blue-800">
                                    <p>이름: {displayName}</p>
                                    <p>권한: 학부모</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h3 className="font-bold text-sm text-gray-900">문의하기</h3>
                                <p className="text-sm text-gray-600">
                                    시스템 이용 중 궁금한 점이 있거나 도움이 필요하면 선생님께 직접 문의하거나 아래의 고객센터로 연락해 주세요.
                                </p>
                                <div className="mt-2 text-sm">
                                    <p className="flex items-center gap-2 text-gray-700">
                                        <span className="font-semibold">Email:</span> {settings.supportEmail}
                                    </p>
                                    <p className="flex items-center gap-2 text-gray-700">
                                        <span className="font-semibold">Tel:</span> {settings.supportPhone}
                                    </p>
                                </div>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg text-xs text-gray-500">
                                <p>앱 버전: v2.2.0 (Latest)</p>
                                <p className="mt-1">화면이 이상하게 보일 경우 &apos;로그아웃&apos; 후 다시 로그인해 보세요.</p>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </aside>
    );
}
