"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Label } from "@/components/ui/label";
import { linkChildToParent, unlinkStudentFromParent } from "@/actions/parent-actions";
import { GraduationCap, UserPlus, User, ChevronRight, Clock, Unlink } from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export interface SentPendingRequest {
    linkId: string;
    studentDocId: string;
    studentName: string;
    requestedAt: string;
}

interface ParentDashboardClientProps {
    parentUid: string;
    linkedStudents: { id: number; name: string; docId: string }[];
    parentName: string;
    sentPendingRequests: SentPendingRequest[];
}

export function ParentDashboardClient({ parentUid, linkedStudents, parentName, sentPendingRequests }: ParentDashboardClientProps) {
    const router = useRouter();
    const { data: session } = useSession();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [form, setForm] = useState({
        studentName: "",
        studentPhone: "",
        parentPhone: "",
    });
    const [unlinkTarget, setUnlinkTarget] = useState<{ docId: string; name: string } | null>(null);
    const [unlinkLoading, setUnlinkLoading] = useState(false);
    const [unlinkError, setUnlinkError] = useState<string | null>(null);

    const uid = (session?.user as { sub?: string })?.sub ?? (session?.user as { id?: string })?.id;

    const UNLINK_CONFIRM_MESSAGE =
        "정말로 연동을 해제하시겠습니까? 해제 시 자녀의 학습 현황을 더 이상 볼 수 없습니다.";

    const handleUnlinkConfirm = async () => {
        if (!uid || !unlinkTarget) return;
        setUnlinkError(null);
        setUnlinkLoading(true);
        const res = await unlinkStudentFromParent(uid, unlinkTarget.docId);
        setUnlinkLoading(false);
        if (res.success) {
            setUnlinkTarget(null);
            setSuccessMessage("연동이 해제되었습니다. 해당 자녀의 학습 현황을 더 이상 조회할 수 없습니다.");
            setTimeout(() => setSuccessMessage(null), 5000);
            router.refresh();
        } else {
            setUnlinkError(res.message ?? "연동 해제에 실패했습니다.");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!uid) {
            setError("로그인 정보가 없습니다.");
            return;
        }
        setError(null);
        setLoading(true);
        const result = await linkChildToParent(uid, {
            studentName: form.studentName.trim(),
            studentPhone: form.studentPhone,
            parentPhone: form.parentPhone,
        });
        setLoading(false);
        if (result.success) {
            setForm({ studentName: "", studentPhone: "", parentPhone: "" });
            setOpen(false);
            setError(null);
            setSuccessMessage("자녀에게 연동 요청이 전달되었습니다. 학생이 승인하면 목록에 표시됩니다.");
            setTimeout(() => setSuccessMessage(null), 5000);
            router.refresh();
        } else {
            setError(result.message ?? "연동에 실패했습니다.");
        }
    };

    const RegisterButton = (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="gap-2 shrink-0">
                    <UserPlus className="h-4 w-4" />
                    자녀 등록
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>자녀 등록</DialogTitle>
                </DialogHeader>
                <p className="text-sm text-gray-600">
                    학생 이름, 학생 전화번호, 학부모 전화번호가 모두 일치하는 경우에만 요청이 전달됩니다. 학생이 승인하면 연동됩니다.
                </p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">
                            {error}
                        </p>
                    )}
                    <div className="space-y-2">
                        <Label htmlFor="studentName">학생 이름</Label>
                        <Input
                            id="studentName"
                            value={form.studentName}
                            onChange={(e) => setForm((f) => ({ ...f, studentName: e.target.value }))}
                            placeholder="학생 이름"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="studentPhone">학생 전화번호</Label>
                        <PhoneInput
                            id="studentPhone"
                            value={form.studentPhone}
                            onChange={(v) => setForm((f) => ({ ...f, studentPhone: v }))}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="parentPhone">학부모 전화번호</Label>
                        <PhoneInput
                            id="parentPhone"
                            value={form.parentPhone}
                            onChange={(v) => setForm((f) => ({ ...f, parentPhone: v }))}
                            required
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            취소
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "연동 중..." : "연동하기"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );

    return (
        <div className="space-y-6">
            {successMessage && (
                <div className="rounded-lg bg-green-50 border border-green-200 text-green-800 px-4 py-3 text-sm">
                    {successMessage}
                </div>
            )}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="min-w-0">
                    <h2 className="text-2xl font-bold text-gray-900">자녀 목록</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        자녀 등록을 통해 자녀를 연동해 주세요. 이름을 클릭하면 해당 자녀의 대시보드(읽기 전용)로 이동합니다.
                    </p>
                </div>
                {RegisterButton}
            </div>

            {linkedStudents.length === 0 ? (
                <Card>
                    <CardContent className="py-12">
                        <div className="flex flex-col items-center justify-center px-4">
                            <GraduationCap className="h-12 w-12 text-gray-400 mb-4" />
                            <p className="text-gray-600 mb-2">연동된 자녀가 없습니다.</p>
                            <p className="text-sm text-gray-500 text-center max-w-sm">
                                위 [자녀 등록] 버튼에서 학생 이름·학생 전화번호·학부모 전화번호를 입력해 연동해 주세요.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 overflow-y-auto overscroll-contain max-h-[70vh] pb-[max(1rem,env(safe-area-inset-bottom))]">
                    {linkedStudents.map((student) => (
                        <div
                            key={student.docId}
                            className="group relative bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all duration-300 overflow-hidden flex flex-col"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-purple-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />

                            <Link href={`/parent/${parentUid}/student/${student.docId}`} className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors shrink-0">
                                            <User size={24} />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors text-lg">{student.name}</h3>
                                            <p className="text-xs text-gray-400">대시보드(읽기 전용) 보기</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center">
                                    <span className="text-xs text-gray-400 flex items-center gap-1 group-hover:text-blue-600 transition-colors">
                                        보기
                                        <ChevronRight size={14} />
                                    </span>
                                </div>
                            </Link>

                            <div className="mt-3 pt-3 border-t border-gray-100">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="w-full min-h-[44px] text-amber-700 border-amber-300 hover:bg-amber-50"
                                    onClick={() => setUnlinkTarget({ docId: student.docId, name: student.name })}
                                >
                                    <Unlink className="h-4 w-4 mr-1.5 shrink-0" />
                                    연동 취소
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <AlertDialog open={!!unlinkTarget} onOpenChange={(open) => !open && setUnlinkTarget(null)}>
                <AlertDialogContent className="pb-[max(1rem,env(safe-area-inset-bottom))]">
                    <AlertDialogHeader>
                        <AlertDialogTitle>연동 취소</AlertDialogTitle>
                        <AlertDialogDescription>{UNLINK_CONFIRM_MESSAGE}</AlertDialogDescription>
                    </AlertDialogHeader>
                    {unlinkTarget && (
                        <p className="text-sm text-gray-600">
                            <strong>{unlinkTarget.name}</strong> 님과의 연동을 취소하면, 해당 자녀의 학습 현황을 더 이상 조회할 수 없습니다.
                        </p>
                    )}
                    {unlinkError && (
                        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">{unlinkError}</p>
                    )}
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={unlinkLoading}>취소</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                handleUnlinkConfirm();
                            }}
                            disabled={unlinkLoading}
                            className="min-h-[44px] bg-amber-600 hover:bg-amber-700"
                        >
                            {unlinkLoading ? "처리 중..." : "연동 취소"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* 보낸 등록 요청 (승인 대기 중) */}
            <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">보낸 등록 요청</h3>
                <p className="text-sm text-muted-foreground mb-3">
                    자녀에게 연동 요청을 보낸 목록입니다. 학생이 승인하면 위 자녀 목록에 표시됩니다.
                </p>
                {sentPendingRequests.length === 0 ? (
                    <Card>
                        <CardContent className="py-8 text-center">
                            <Clock className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">대기 중인 등록 요청이 없습니다.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-2">
                        {sentPendingRequests.map((req) => (
                            <Card key={req.linkId}>
                                <CardContent className="py-4 flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <Clock className="h-5 w-5 text-amber-500 shrink-0" />
                                        <div>
                                            <p className="font-medium text-gray-900">
                                                <strong>{req.studentName}</strong>(학생)에게 자녀 등록 요청을 보냈습니다.
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                승인 대기 중 · {req.requestedAt ? new Date(req.requestedAt).toLocaleDateString("ko-KR") : ""}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded">승인 대기</span>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
