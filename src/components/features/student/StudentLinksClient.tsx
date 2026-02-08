"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Users } from "lucide-react";

export interface PendingRequest {
    linkId: string;
    parentUid: string;
    parentName: string;
    requestedAt: string;
}

export interface ConnectedParent {
    uid: string;
    name: string;
}

interface StudentLinksClientProps {
    studentDocId: string;
    pendingRequests: PendingRequest[];
    connectedParents: ConnectedParent[];
}

export function StudentLinksClient({ pendingRequests: _pendingRequests, connectedParents }: StudentLinksClientProps) {
    return (
        <div className="space-y-6">
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
                    나와 연동되어 내 정보를 읽을 수 있는 부모님 목록입니다.
                </p>
                {connectedParents.length === 0 ? (
                    <Card>
                        <CardContent className="py-8 text-center">
                            <Users className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">연동된 학부모가 없습니다.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-2">
                        {connectedParents.map((parent) => (
                            <Card key={parent.uid}>
                                <CardContent className="py-4 flex items-center gap-3">
                                    <Users className="h-5 w-5 text-blue-500 shrink-0" />
                                    <div>
                                        <p className="font-medium text-gray-900">{parent.name}</p>
                                        <p className="text-xs text-muted-foreground">연동됨</p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
