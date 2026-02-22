"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Users, HelpCircle, LogOut, Edit2, Check, X, ShieldCheck, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { getSystemSettings, updateSystemSettings } from "@/actions/system-actions";
import { withdrawAdminAccount } from "@/actions/account-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

interface AdminSidebarProps {
    userName?: string;
    /** 서버에서 조회한 Firestore 역할. 있으면 세션보다 우선해 메뉴·라벨에 사용 */
    isSuperAdmin?: boolean;
    className?: string;
}

export function AdminSidebar({ userName, isSuperAdmin: isSuperAdminFromServer, className }: AdminSidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { data: session } = useSession();
    const role = (session?.user as { role?: string })?.role;
    const isSuperAdmin = isSuperAdminFromServer ?? (role === "SUPER_ADMIN");
    const displayName = userName?.trim() || session?.user?.name || "관리자";
    const adminUid = (session?.user as { sub?: string })?.sub ?? (session?.user as { id?: string })?.id;
    const [settings, setSettings] = useState({ supportEmail: 'support@mathclinic.com', supportPhone: '02-1234-5678' });
    const [isEditing, setIsEditing] = useState(false);
    const [editValues, setEditValues] = useState({ supportEmail: '', supportPhone: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [confirmWithdraw, setConfirmWithdraw] = useState(false);
    const [supportError, setSupportError] = useState<string | null>(null);
    const [supportLoading, setSupportLoading] = useState(false);

    useEffect(() => {
        getSystemSettings().then(data => {
            setSettings(data);
            setEditValues(data);
        });
    }, []);

    const handleStartEdit = () => {
        setEditValues(settings);
        setIsEditing(true);
    };

    const handleSave = async () => {
        setIsLoading(true);
        const result = await updateSystemSettings(editValues.supportEmail, editValues.supportPhone);
        if (result.success) {
            setSettings(editValues);
            setIsEditing(false);
        }
        setIsLoading(false);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setEditValues(settings);
    };

    const menuItems: { href: string; label: string; icon: typeof Users; superAdminOnly?: boolean }[] = [
        { href: "/admin/students", label: "학생 관리", icon: Users },
        { href: "/admin/parents", label: "학부모 관리", icon: UserCircle },
        { href: "/admin/admins", label: "관리자 관리", icon: ShieldCheck, superAdminOnly: true },
    ].filter((item) => !item.superAdminOnly || isSuperAdmin);

    return (
        <aside className={cn("w-64 bg-white border-r border-gray-200 flex flex-col h-full shadow-sm", className)}>
            {/* Logo Section */}
            <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center shrink-0">
                        <span className="text-xl font-bold text-white">M</span>
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-base font-bold text-gray-900 tracking-tight leading-tight">강나리 MATH LAB</h1>
                        <p className="text-xs text-gray-500 mt-0.5 font-normal">{isSuperAdmin ? "Super Admin" : "Admin"}</p>
                    </div>
                </div>
            </div>

            {/* User Info: 역할·이름 (서버에서 넘긴 Firestore 기준) */}
            <div className="p-4 border-b border-gray-200">
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">{isSuperAdmin ? "Super Admin" : "Admin"}</p>
                    <p className="text-sm font-semibold text-gray-900 truncate">{displayName}</p>
                </div>
            </div>

            {/* Menu Items */}
            <nav className="flex-1 min-h-0 p-4 overflow-y-auto">
                <ul className="space-y-1">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname?.startsWith(item.href) ?? false;
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
            <div className="p-4 border-t border-gray-200 space-y-2 shrink-0">
                <Link
                    href="/login"
                    className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-100 hover:text-red-600 rounded-lg transition-colors"
                >
                    <LogOut size={20} />
                    <span>로그아웃</span>
                </Link>

                <Dialog
                    onOpenChange={(open) => {
                        if (!open) {
                            setConfirmWithdraw(false);
                            setSupportError(null);
                        }
                    }}
                >
                    <DialogTrigger asChild>
                        <button
                            className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-colors min-h-[44px]"
                        >
                            <HelpCircle size={20} />
                            <span>Support</span>
                        </button>
                    </DialogTrigger>
                    <DialogContent className="pb-[max(1rem,env(safe-area-inset-bottom))] max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>고객 지원 및 계정 설정</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-6 py-4 pr-2">
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <h3 className="font-bold text-sm mb-2 text-gray-900">내 계정 정보</h3>
                                <div className="space-y-1 text-sm text-gray-600">
                                    <p>이름: {displayName}</p>
                                    <p>권한: {isSuperAdmin ? "Super Admin (관리자 관리 가능)" : "Admin"}</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-bold text-sm text-gray-900">문의하기 정보 관리</h3>
                                    {!isEditing && (
                                        <Button variant="ghost" size="sm" onClick={handleStartEdit} className="h-8 w-8 p-0 min-h-[44px] min-w-[44px]">
                                            <Edit2 size={14} />
                                        </Button>
                                    )}
                                </div>

                                {isEditing ? (
                                    <div className="space-y-3 p-3 border border-blue-200 rounded-lg bg-blue-50/50">
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-gray-700">이메일</label>
                                            <Input
                                                value={editValues.supportEmail}
                                                onChange={(e) => setEditValues({ ...editValues, supportEmail: e.target.value })}
                                                className="h-8 text-sm bg-white"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-gray-700">전화번호</label>
                                            <Input
                                                value={editValues.supportPhone}
                                                onChange={(e) => setEditValues({ ...editValues, supportPhone: e.target.value })}
                                                className="h-8 text-sm bg-white"
                                            />
                                        </div>
                                        <div className="flex justify-end gap-2 mt-2">
                                            <Button variant="outline" size="sm" onClick={handleCancel} className="h-8 text-xs min-h-[44px]">
                                                <X size={14} className="mr-1" /> 취소
                                            </Button>
                                            <Button size="sm" onClick={handleSave} disabled={isLoading} className="h-8 text-xs bg-blue-600 hover:bg-blue-700 min-h-[44px]">
                                                <Check size={14} className="mr-1" /> 저장
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <p className="text-sm text-gray-600">
                                            학생들이 보게 될 문의처 정보입니다.
                                        </p>
                                        <div className="mt-2 text-sm">
                                            <p className="flex items-center gap-2 text-gray-700">
                                                <span className="font-semibold">Email:</span> {settings.supportEmail}
                                            </p>
                                            <p className="flex items-center gap-2 text-gray-700">
                                                <span className="font-semibold">Tel:</span> {settings.supportPhone}
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>

                            {adminUid && (
                                <div className="border-t border-gray-200 pt-4 space-y-4">
                                    <h3 className="font-bold text-sm text-gray-900">계정 관리</h3>
                                    {supportError && (
                                        <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{supportError}</p>
                                    )}
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
                                        <p className="text-sm text-red-900">관리자 계정을 탈퇴하면 로그인이 불가하며, 최소 1명의 관리자는 유지되어야 합니다.</p>
                                        <label className="flex items-center gap-2 cursor-pointer min-h-[44px]">
                                            <Checkbox checked={confirmWithdraw} onCheckedChange={(v) => setConfirmWithdraw(!!v)} />
                                            <span className="text-sm">탈퇴를 원한다는 것을 확인했습니다.</span>
                                        </label>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full min-h-[44px] text-red-700 border-red-300 hover:bg-red-100"
                                            disabled={!confirmWithdraw || supportLoading}
                                            onClick={async () => {
                                                setSupportLoading(true);
                                                setSupportError(null);
                                                const res = await withdrawAdminAccount(adminUid);
                                                setSupportLoading(false);
                                                if (res.success) {
                                                    await signOut({ callbackUrl: "/admin-login" });
                                                    router.push("/admin-login");
                                                    return;
                                                }
                                                setSupportError(res.message ?? "처리 실패");
                                            }}
                                        >
                                            회원 탈퇴
                                        </Button>
                                    </div>
                                </div>
                            )}

                            <div className="bg-blue-50 p-4 rounded-lg text-xs text-blue-700 pb-[env(safe-area-inset-bottom)]">
                                <p>현재 버전: v2.2.0 (Latest)</p>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </aside>
    );
}
