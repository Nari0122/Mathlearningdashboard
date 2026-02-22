"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";

/**
 * 학생 status === PENDING 일 때만 접근. 대시보드 차단, 승인 대기 안내.
 */
export default function PendingApprovalPage() {
    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                                <Clock className="w-6 h-6 text-amber-600" />
                            </div>
                            <CardTitle className="text-lg">승인 대기 중</CardTitle>
                        </div>
                        <p className="text-sm text-gray-600">
                            회원가입이 완료되었습니다. 관리자 승인 후 서비스를 이용하실 수 있습니다.
                        </p>
                    </CardHeader>
                    <CardContent>
                        <Button asChild variant="outline" className="w-full">
                            <Link href="/login">로그인 화면으로</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
