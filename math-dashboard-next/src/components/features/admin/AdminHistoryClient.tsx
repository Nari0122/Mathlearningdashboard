"use client";

import { useState, useTransition } from "react";
import { Plus, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createLearningRecord, updateLearningRecord, deleteLearningRecord } from "@/actions/learning-actions";
import { useRouter } from "next/navigation";

interface AdminHistoryClientProps {
    records: any[];
    studentDocId: string;
}

export default function AdminHistoryClient({ records, studentDocId }: AdminHistoryClientProps) {
    const router = useRouter();
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [currentEditId, setCurrentEditId] = useState<number | null>(null);
    const [isPending, startTransition] = useTransition();

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
                sessionNumber: sessionNumber ? parseInt(sessionNumber) : undefined
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

    const handleDelete = async (id: number) => {
        if (!confirm("정말 삭제하시겠습니까?")) return;
        startTransition(async () => {
            const result = await deleteLearningRecord(String(id), studentDocId);
            if (result.success) {
                router.refresh();
            } else {
                alert("삭제 실패");
            }
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <ClipboardList className="w-8 h-8 text-indigo-600" />
                    <h2 className="text-xl font-bold">학습 기록 관리</h2>
                </div>
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button><Plus className="mr-2 h-4 w-4" /> 기록 추가</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>새 학습 기록 추가</DialogTitle></DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="date" className="text-right">날짜</Label>
                                <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="progress" className="text-right">진도/내용</Label>
                                <Input id="progress" value={progress} onChange={(e) => setProgress(e.target.value)} className="col-span-3" placeholder="예: 미적분 p.30~40" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="sessionNumber" className="text-right">수업 회차</Label>
                                <Input id="sessionNumber" type="number" min="1" value={sessionNumber} onChange={(e) => setSessionNumber(e.target.value)} className="col-span-3" placeholder="예: 1, 2, 3..." />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
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

                {/* Edit Dialog */}
                <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                    <DialogContent>
                        <DialogHeader><DialogTitle>학습 기록 수정</DialogTitle></DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="edit-date" className="text-right">날짜</Label>
                                <Input id="edit-date" type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="edit-progress" className="text-right">진도/내용</Label>
                                <Input id="edit-progress" value={editProgress} onChange={(e) => setEditProgress(e.target.value)} className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="edit-sessionNumber" className="text-right">수업 회차</Label>
                                <Input id="edit-sessionNumber" type="number" min="1" value={editSessionNumber} onChange={(e) => setEditSessionNumber(e.target.value)} className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
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
            </div>

            <div className="space-y-4">
                {records.length === 0 ? (
                    <div className="text-center py-20 bg-gray-50 rounded-lg border border-dashed">
                        <p className="text-gray-500">등록된 학습 기록이 없습니다.</p>
                    </div>
                ) : (
                    records.map((record: any) => (
                        <div key={record.id} className="bg-white p-6 rounded-xl border border-gray-200">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    {record.sessionNumber && (
                                        <span className="text-sm font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{record.sessionNumber}회차</span>
                                    )}
                                    <h3 className="font-bold text-lg">{record.progress}</h3>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">{record.createdBy === 'student' ? '학생 작성' : '관리자 작성'}</span>
                                    <span className="text-sm text-gray-400">{record.date}</span>
                                </div>
                            </div>
                            <p className="text-gray-600 mb-4 whitespace-pre-wrap">{record.comment}</p>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => handleEditClick(record)}>
                                    수정
                                </Button>
                                <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600" onClick={() => handleDelete(record.id)}>
                                    삭제
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
