"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import { Users, Unlink, Clock, Check, X } from "lucide-react";
import { unlinkParentFromStudent, acceptParentLinkRequest, rejectParentLinkRequest } from "@/actions/parent-actions";

export interface PendingRequest {
    linkId: string;
    parentUid: string;
    parentName: string;
    requestedAt: string;
}

export interface ConnectedParent {
    uid: string;
    name: string;
    phoneNumber?: string;
}

interface StudentLinksClientProps {
    studentDocId: string;
    pendingRequests: PendingRequest[];
    connectedParents: ConnectedParent[];
}

const UNLINK_CONFIRM_MESSAGE =
    "정말로 연동을 해제하시겠습니까? 해제 시 해당 학부모님은 자녀의 학습 현황을 더 이상 볼 수 없습니다.";

export function StudentLinksClient({ pendingRequests, connectedParents, studentDocId }: StudentLinksClientProps) {
    const router = useRouter();
    const [unlinkTarget, setUnlinkTarget] = useState<ConnectedParent | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [pendingError, setPendingError] = useState<string | null>(null);

    const [localPending, setLocalPending] = useState(pendingRequests);
    const [localParents, setLocalParents] = useState(connectedParents);
    useEffect(() => { setLocalPending(pendingRequests); }, [pendingRequests]);
    useEffect(() => { setLocalParents(connectedParents); }, [connectedParents]);

    const handleUnlink = async () => {
        if (!unlinkTarget) return;
        const target = unlinkTarget;
        setError(null);
        setUnlinkTarget(null);
        setLocalParents((prev) => prev.filter((p) => p.uid !== target.uid));
        setSuccessMessage("연동이 해제되었습니다.");
        setTimeout(() => setSuccessMessage(null), 5000);

        const res = await unlinkParentFromStudent(studentDocId, target.uid);
        if (res.success) {
            router.refresh();
        } else {
            setLocalParents((prev) => [...prev, target]);
            setSuccessMessage(null);
            setError(res.message ?? "연동 해제에 실패했습니다.");
        }
    };

    const handleAccept = async (linkId: string, parentName: string) => {
        const removedReq = localPending.find((r) => r.linkId === linkId);
        setLocalPending((prev) => prev.filter((r) => r.linkId !== linkId));
        setSuccessMessage(`${parentName} 님의 연동 요청을 수락했습니다.`);
        setTimeout(() => setSuccessMessage(null), 5000);

        try {
            const res = await acceptParentLinkRequest(studentDocId, linkId);
            if (res.success) {
                router.refresh();
            } else {
                if (removedReq) setLocalPending((prev) => [...prev, removedReq]);
                setSuccessMessage(null);
                setPendingError(res.message ?? "승인에 실패했습니다.");
                setTimeout(() => setPendingError(null), 5000);
            }
        } catch {
            if (removedReq) setLocalPending((prev) => [...prev, removedReq]);
            setSuccessMessage(null);
            setPendingError("승인 처리 중 오류가 발생했습니다.");
            setTimeout(() => setPendingError(null), 5000);
        }
    };

    const handleReject = async (linkId: string, parentName: string) => {
        const removedReq = localPending.find((r) => r.linkId === linkId);
        setLocalPending((prev) => prev.filter((r) => r.linkId !== linkId));
        setSuccessMessage(`${parentName} 님의 연동 요청을 거절했습니다.`);
        setTimeout(() => setSuccessMessage(null), 5000);

        try {
            const res = await rejectParentLinkRequest(studentDocId, linkId);
            if (res.success) {
                router.refresh();
            } else {
                if (removedReq) setLocalPending((prev) => [...prev, removedReq]);
                setSuccessMessage(null);
                setPendingError(res.message ?? "거절에 실패했습니다.");
                setTimeout(() => setPendingError(null), 5000);
            }
        } catch {
            if (removedReq) setLocalPending((prev) => [...prev, removedReq]);
            setSuccessMessage(null);
            setPendingError("거절 처리 중 오류가 발생했습니다.");
            setTimeout(() => setPendingError(null), 5000);
        }
    };

    return (
        <div className="space-y-6 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <div>
                <h2 className="text-xl font-bold text-gray-900">연동 관리</h2>
                <p className="text-sm text-muted-foreground mt-1">
                    학부모가 자녀 등록을 하면 여기에서 승인하거나 거절할 수 있습니다.
                </p>
            </div>

            {successMessage && (
                <div className="rounded-lg bg-green-50 border border-green-200 text-green-800 px-4 py-3 text-sm">
                    {successMessage}
                </div>
            )}

            {pendingError && (
                <div className="rounded-lg bg-red-50 border border-red-200 text-red-800 px-4 py-3 text-sm">
                    {pendingError}
                </div>
            )}

            {/* 학부모 연동 요청 (승인 대기) */}
            {localPending.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">받은 연동 요청</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                        학부모님이 자녀 등록 요청을 보냈습니다. 수락하면 해당 학부모님이 학습 현황을 볼 수 있습니다.
                    </p>
                    <div className="space-y-2">
                        {localPending.map((req) => (
                            <Card key={req.linkId} className="border-amber-200 bg-amber-50/50">
                                <CardContent className="py-4 flex flex-wrap items-center justify-between gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <Clock className="h-5 w-5 text-amber-500 shrink-0" />
                                        <div className="min-w-0">
                                            <p className="font-medium text-gray-900">{req.parentName}</p>
                                            <p className="text-xs text-muted-foreground">
                                                연동 요청 · {req.requestedAt ? new Date(req.requestedAt).toLocaleDateString("ko-KR") : ""}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 shrink-0">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="min-h-[40px] text-red-600 border-red-300 hover:bg-red-50"
                                            onClick={() => handleReject(req.linkId, req.parentName)}
                                        >
                                            <X className="h-4 w-4 mr-1" />
                                            거절
                                        </Button>
                                        <Button
                                            size="sm"
                                            className="min-h-[40px] bg-blue-600 hover:bg-blue-700"
                                            onClick={() => handleAccept(req.linkId, req.parentName)}
                                        >
                                            <Check className="h-4 w-4 mr-1" />
                                            수락
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* 연동된 학부모 */}
            <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">연동된 학부모</h3>
                <p className="text-sm text-muted-foreground mb-3">
                    나와 연동되어 내 정보를 읽을 수 있는 부모님 목록입니다. 연동을 해제하면 해당 학부모님은 학습 현황을 볼 수 없습니다.
                </p>
                {localParents.length === 0 ? (
                    <Card>
                        <CardContent className="py-8 text-center">
                            <Users className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">연동된 학부모가 없습니다.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <ul className="space-y-2 overflow-y-auto max-h-[60vh] overscroll-contain">
                        {localParents.map((parent) => (
                            <Card key={parent.uid}>
                                <CardContent className="py-4 flex flex-wrap items-center justify-between gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <Users className="h-5 w-5 text-blue-500 shrink-0" />
                                        <div className="min-w-0">
                                            <p className="font-medium text-gray-900">{parent.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {parent.phoneNumber ? (
                                                    <span>연동됨 · {parent.phoneNumber}</span>
                                                ) : (
                                                    "연동됨"
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="shrink-0 min-h-[44px] text-amber-700 border-amber-300 hover:bg-amber-50"
                                        onClick={() => setUnlinkTarget(parent)}
                                    >
                                        <Unlink className="h-4 w-4 mr-1.5" />
                                        연동 해제
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </ul>
                )}
            </div>

            <Dialog open={!!unlinkTarget} onOpenChange={(open) => !open && setUnlinkTarget(null)}>
                <DialogContent className="pb-[max(1rem,env(safe-area-inset-bottom))] sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>연동 해제</DialogTitle>
                        <DialogDescription>{UNLINK_CONFIRM_MESSAGE}</DialogDescription>
                    </DialogHeader>
                    {unlinkTarget && (
                        <p className="text-sm text-gray-600">
                            <strong>{unlinkTarget.name}</strong>
                            {unlinkTarget.phoneNumber ? ` (${unlinkTarget.phoneNumber})` : ""} 님과의 연동을 해제합니다.
                        </p>
                    )}
                    {error && (
                        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">{error}</p>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setUnlinkTarget(null)}>
                            취소
                        </Button>
                        <Button variant="destructive" onClick={handleUnlink} className="min-h-[44px]">
                            연동 해제
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
