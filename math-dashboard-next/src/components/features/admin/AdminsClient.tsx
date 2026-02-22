"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { updateAdminStatusAction, deleteAdminAction } from "@/actions/admin-management-actions";
import type { FirestoreUserAdmin } from "@/types/firestore-user";
import { formatPhoneDisplay } from "@/lib/phone";
import { UserCheck, User, Loader2, Trash2 } from "lucide-react";

type AdminRow = FirestoreUserAdmin & { uid: string };

interface AdminsClientProps {
    list: AdminRow[];
}

export function AdminsClient({ list }: AdminsClientProps) {
    const router = useRouter();
    const [isPendingModalOpen, setIsPendingModalOpen] = useState(false);
    const [loadingUid, setLoadingUid] = useState<string | null>(null);
    const [deletingUid, setDeletingUid] = useState<string | null>(null);

    const superAdmins = list.filter((a) => a.role === "SUPER_ADMIN");
    const approvedAdmins = list.filter((a) => a.role === "ADMIN" && a.status === "APPROVED");
    const pendingAdmins = list.filter((a) => a.role === "ADMIN" && a.status === "PENDING");

    const handleApprove = async (uid: string) => {
        setLoadingUid(uid);
        const result = await updateAdminStatusAction(uid, "APPROVED");
        setLoadingUid(null);
        if (result.success) {
            router.refresh();
        } else {
            alert(result.message ?? "처리 실패");
        }
    };

    const handleDelete = async (a: AdminRow) => {
        if (a.role === "SUPER_ADMIN") return;
        const message = `"${a.name}"${a.username ? ` (@${a.username})` : ""} 관리자 계정을 삭제하시겠습니까? 삭제 후에는 복구할 수 없습니다.`;
        if (!confirm(message)) return;
        setDeletingUid(a.uid);
        const result = await deleteAdminAction(a.uid);
        setDeletingUid(null);
        if (result.success) {
            router.refresh();
        } else {
            alert(result.message ?? "삭제 실패");
        }
    };

    return (
        <div className="space-y-6">
            {/* 제목·설명과 승인 대기 버튼을 같은 줄에 */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">관리자 관리</h1>
                    <p className="text-gray-600 mt-1">가입한 관리자를 승인하거나 반려할 수 있습니다. (Super Admin 전용)</p>
                </div>
                <Dialog open={isPendingModalOpen} onOpenChange={setIsPendingModalOpen}>
                    <DialogTrigger asChild>
                        <Button className="w-full sm:w-auto h-11 px-6 bg-gray-900 hover:bg-gray-800 text-white rounded-xl shadow-md transition-all hover:shadow-lg">
                            <UserCheck className="mr-2 h-4 w-4" />
                            승인 대기
                            {pendingAdmins.length > 0 && (
                                <span className="ml-2 bg-amber-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                                    {pendingAdmins.length}
                                </span>
                            )}
                        </Button>
                    </DialogTrigger>
                <DialogContent className="sm:max-w-[600px] border-none shadow-2xl overflow-y-auto max-h-[85vh]">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold">승인 대기 (관리자)</DialogTitle>
                            <p className="text-sm text-gray-500">PENDING → APPROVED로 변경하면 서비스 이용이 가능합니다.</p>
                        </DialogHeader>
                        <div className="py-4">
                            {pendingAdmins.length === 0 ? (
                                <p className="text-gray-500 text-center py-8">승인 대기 중인 관리자가 없습니다.</p>
                            ) : (
                                <ul className="space-y-3">
                                    {pendingAdmins.map((a) => (
                                        <li
                                            key={a.uid}
                                            className="flex items-center justify-between gap-4 p-4 rounded-xl border border-gray-200 bg-gray-50"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                                                    <User className="h-5 w-5 text-gray-500" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-medium text-gray-900 truncate">{a.name}</p>
                                                    <p className="text-sm text-gray-500 truncate">
                                                        {a.phoneNumber ? formatPhoneDisplay(a.phoneNumber) : "연락처 미등록"}
                                                        {a.username ? ` · @${a.username}` : ""}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleApprove(a.uid)}
                                                    disabled={loadingUid !== null}
                                                    className="bg-blue-600 hover:bg-blue-700"
                                                >
                                                    {loadingUid === a.uid ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        "승인"
                                                    )}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => handleDelete(a)}
                                                    disabled={deletingUid !== null}
                                                    title="계정 삭제"
                                                >
                                                    {deletingUid === a.uid ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                                </Button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsPendingModalOpen(false)} className="h-10">
                                닫기
                            </Button>
                        </DialogFooter>
                </DialogContent>
                </Dialog>
            </div>

            {superAdmins.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Super Admin</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2">
                            {superAdmins.map((a) => (
                                <li
                                    key={a.uid}
                                    className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                                >
                                    <div>
                                        <span className="font-medium">{a.name}</span>
                                        {a.username && <span className="text-gray-500 ml-2">@{a.username}</span>}
                                        {a.phoneNumber && <span className="text-gray-500 ml-2">{formatPhoneDisplay(a.phoneNumber)}</span>}
                                    </div>
                                    <Badge variant="secondary">Super Admin</Badge>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">승인된 Admin</CardTitle>
                </CardHeader>
                <CardContent>
                    {approvedAdmins.length === 0 ? (
                        <p className="text-gray-500 py-4">승인된 Admin이 없습니다.</p>
                    ) : (
                        <ul className="space-y-2">
                            {approvedAdmins.map((a) => (
                                <li
                                    key={a.uid}
                                    className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                                >
                                    <div>
                                        <span className="font-medium">{a.name}</span>
                                        {a.username && <span className="text-gray-500 ml-2">@{a.username}</span>}
                                        {a.phoneNumber && <span className="text-gray-500 ml-2">{formatPhoneDisplay(a.phoneNumber)}</span>}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="default">승인됨</Badge>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                            onClick={() => handleDelete(a)}
                                            disabled={deletingUid !== null}
                                            title="계정 삭제"
                                        >
                                            {deletingUid === a.uid ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
