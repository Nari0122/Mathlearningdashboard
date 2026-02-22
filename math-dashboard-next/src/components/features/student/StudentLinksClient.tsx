"use client";

import { useState } from "react";
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
import { Users, Unlink } from "lucide-react";
import { unlinkParentFromStudent } from "@/actions/parent-actions";

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

export function StudentLinksClient({ pendingRequests: _pendingRequests, connectedParents, studentDocId }: StudentLinksClientProps) {
    const router = useRouter();
    const [unlinkTarget, setUnlinkTarget] = useState<ConnectedParent | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleUnlink = async () => {
        if (!unlinkTarget) return;
        setError(null);
        setLoading(true);
        const res = await unlinkParentFromStudent(studentDocId, unlinkTarget.uid);
        setLoading(false);
        if (res.success) {
            setUnlinkTarget(null);
            router.refresh();
        } else {
            setError(res.message ?? "연동 해제에 실패했습니다.");
        }
    };

    return (
        <div className="space-y-6 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <div>
                <h2 className="text-xl font-bold text-gray-900">연동 관리</h2>
                <p className="text-sm text-muted-foreground mt-1">
                    학부모가 자녀 등록을 하면 여기에서 연동된 학부모 목록으로 확인할 수 있습니다.
                </p>
            </div>

            {/* 연동된 학부모 */}
            <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">연동된 학부모</h3>
                <p className="text-sm text-muted-foreground mb-3">
                    나와 연동되어 내 정보를 읽을 수 있는 부모님 목록입니다. 연동을 해제하면 해당 학부모님은 학습 현황을 볼 수 없습니다.
                </p>
                {connectedParents.length === 0 ? (
                    <Card>
                        <CardContent className="py-8 text-center">
                            <Users className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">연동된 학부모가 없습니다.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <ul className="space-y-2 overflow-y-auto max-h-[60vh] overscroll-contain">
                        {connectedParents.map((parent) => (
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
                        <Button variant="outline" onClick={() => setUnlinkTarget(null)} disabled={loading}>
                            취소
                        </Button>
                        <Button variant="destructive" onClick={handleUnlink} disabled={loading} className="min-h-[44px]">
                            {loading ? "처리 중..." : "연동 해제"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
