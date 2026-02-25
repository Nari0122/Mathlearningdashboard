"use client";

import { useState, useTransition } from "react";
import { Plus, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createLearningRecord, updateLearningRecord, deleteLearningRecord } from "@/actions/learning-actions";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";

interface AdminHistoryClientProps {
    records: any[];
    studentDocId: string;
    adminName?: string;
}

export default function AdminHistoryClient({ records, studentDocId, adminName }: AdminHistoryClientProps) {
    const router = useRouter();
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [currentEditId, setCurrentEditId] = useState<number | null>(null);
    const [isPending, startTransition] = useTransition();
    const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

    const [date, setDate] = useState("");
    const [progress, setProgress] = useState("");
    const [comment, setComment] = useState("");
    const [sessionNumber, setSessionNumber] = useState("");

    const [editDate, setEditDate] = useState("");
    const [editProgress, setEditProgress] = useState("");
    const [editComment, setEditComment] = useState("");
    const [editSessionNumber, setEditSessionNumber] = useState("");

    const handleAdd = async () => {
        if (!date || !progress) return;

        startTransition(async () => {
            const result = await createLearningRecord(studentDocId, {
                date,
                progress,
                comment,
                sessionNumber: sessionNumber ? parseInt(sessionNumber) : undefined,
                createdBy: "admin",
                createdByName: adminName || "관리자",
            });

            if (result.success) {
                setIsAddOpen(false);
                setDate("");
                setProgress("");
                setComment("");
                setSessionNumber("");
                router.refresh();
            } else {
                alert("기록 추가 실패");
            }
        });
    };

    const handleEditClick = (record: any) => {
        setCurrentEditId(record.id);
        setEditDate(record.date);
        setEditProgress(record.progress);
        setEditComment(record.comment);
        setEditSessionNumber(record.sessionNumber ? String(record.sessionNumber) : "");
        setIsEditOpen(true);
    };

    const handleUpdate = async () => {
        if (!currentEditId || !editDate || !editProgress) return;

        startTransition(async () => {
            const result = await updateLearningRecord(String(currentEditId), studentDocId, {
                date: editDate,
                progress: editProgress,
                comment: editComment,
                sessionNumber: editSessionNumber ? parseInt(editSessionNumber) : undefined
            });

            if (result.success) {
                setIsEditOpen(false);
                router.refresh();
            } else {
                alert("수정 실패");
            }
        });
    };

    const handleDeleteConfirm = async () => {
        if (deleteTarget === null) return;
        const id = deleteTarget;
        setDeleteTarget(null);
        startTransition(async () => {
            const result = await deleteLearningRecord(String(id), studentDocId);
            if (result.success) {
                router.refresh();
            }
        });
    };

    return (
        <div className="space-y-5 text-[18px] leading-relaxed">
            <PageHeader
                title="학습 기록 관리"
                description="수업별 학습 내용을 기록하고 히스토리를 관리하는 페이지입니다."
                icon={<ClipboardList className="w-6 h-6 text-indigo-600" />}
                actions={
                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" /> 기록 추가
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[480px] text-sm">
                            <DialogHeader>
                                <DialogTitle className="text-base font-semibold">새 학습 기록 추가</DialogTitle>
                            </DialogHeader>
                        <div className="grid gap-3 py-3">
                            <div className="grid grid-cols-4 items-center gap-3">
                                <Label htmlFor="date" className="text-right">날짜</Label>
                                <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-3">
                                <Label htmlFor="progress" className="text-right">진도/내용</Label>
                                <Input id="progress" value={progress} onChange={(e) => setProgress(e.target.value)} className="col-span-3" placeholder="예: 미적분 p.30~40" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-3">
                                <Label htmlFor="sessionNumber" className="text-right">수업 회차</Label>
                                <Input id="sessionNumber" type="number" min="1" value={sessionNumber} onChange={(e) => setSessionNumber(e.target.value)} className="col-span-3" placeholder="예: 1, 2, 3..." />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-3">
                                <Label htmlFor="comment" className="text-right">코멘트</Label>
                                <Textarea id="comment" value={comment} onChange={(e) => setComment(e.target.value)} className="col-span-3" placeholder="학생 반응, 특이사항 등" />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleAdd} disabled={isPending}>
                                {isPending ? "추가 중..." : "추가하기"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
                }
            />

            {/* Edit Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-[480px] text-sm">
                    <DialogHeader>
                        <DialogTitle className="text-base font-semibold">학습 기록 수정</DialogTitle>
                    </DialogHeader>
                        <div className="grid gap-3 py-3">
                            <div className="grid grid-cols-4 items-center gap-3">
                                <Label htmlFor="edit-date" className="text-right">날짜</Label>
                                <Input id="edit-date" type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-3">
                                <Label htmlFor="edit-progress" className="text-right">진도/내용</Label>
                                <Input id="edit-progress" value={editProgress} onChange={(e) => setEditProgress(e.target.value)} className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-3">
                                <Label htmlFor="edit-sessionNumber" className="text-right">수업 회차</Label>
                                <Input id="edit-sessionNumber" type="number" min="1" value={editSessionNumber} onChange={(e) => setEditSessionNumber(e.target.value)} className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-3">
                                <Label htmlFor="edit-comment" className="text-right">코멘트</Label>
                                <Textarea id="edit-comment" value={editComment} onChange={(e) => setEditComment(e.target.value)} className="col-span-3" />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleUpdate} disabled={isPending}>
                                {isPending ? "수정 중..." : "수정하기"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

            <div className="space-y-3">
                {records.length === 0 ? (
                    <div className="text-center py-14 bg-gray-50 rounded-lg border border-dashed">
                        <p className="text-gray-500 text-sm">등록된 학습 기록이 없습니다.</p>
                    </div>
                ) : (
                    records.map((record: any) => (
                        <div key={record.id} className="bg-white p-4 rounded-lg border border-gray-200">
                            <div className="flex justify-between items-start mb-1.5">
                                <div className="flex items-center gap-2">
                                    {record.sessionNumber && (
                                        <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded whitespace-nowrap">
                                            {record.sessionNumber}회차
                                        </span>
                                    )}
                                    <h3 className="font-semibold text-sm">{record.progress}</h3>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 whitespace-nowrap">
                                        {record.createdBy === 'student' ? '학생 작성' : `${record.createdByName || '관리자'} 작성`}
                                    </span>
                                    <span className="text-[11px] text-gray-400">{record.date}</span>
                                </div>
                            </div>
                            <p className="text-gray-600 mb-3 whitespace-pre-wrap text-xs leading-snug">
                                {record.comment}
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 px-3 text-xs"
                                    onClick={() => handleEditClick(record)}
                                >
                                    수정
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 px-3 text-xs text-red-500 hover:text-red-600"
                                    onClick={() => setDeleteTarget(record.id)}
                                >
                                    삭제
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>학습 기록 삭제</AlertDialogTitle>
                        <AlertDialogDescription>정말 이 학습 기록을 삭제하시겠습니까? 삭제된 기록은 복구할 수 없습니다.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>취소</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">삭제</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
