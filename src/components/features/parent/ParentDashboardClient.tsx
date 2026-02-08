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
import { linkChildToParent } from "@/actions/parent-actions";
import { GraduationCap, UserPlus, User, ChevronRight, Clock } from "lucide-react";

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

    const uid = (session?.user as { sub?: string })?.sub ?? (session?.user as { id?: string })?.id;

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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {linkedStudents.map((student) => (
                        <Link key={student.docId} href={`/parent/${parentUid}/student/${student.docId}`}>
                            <div className="group relative bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all duration-300 cursor-pointer overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-purple-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />

                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                                            <User size={24} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors text-lg">{student.name}</h3>
                                            <p className="text-xs text-gray-400">대시보드(읽기 전용) 보기</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 pt-4 border-t border-gray-50 flex justify-end items-center">
                                    <span className="text-xs text-gray-400 flex items-center gap-1 group-hover:text-blue-600 transition-colors">
                                        보기
                                        <ChevronRight size={14} />
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

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
