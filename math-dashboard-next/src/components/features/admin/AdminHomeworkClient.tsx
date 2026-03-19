"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, Trash, PenTool } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createHomework, updateHomework, deleteHomework } from "@/actions/admin-actions";
import { useRouter } from "next/navigation";
import { isSubmissionLocked } from "@/lib/submissionDeadline";
import { PageHeader } from "@/components/shared/PageHeader";

function formatDateTime(dateString: string | Date | null) {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleString("ko-KR", {
        timeZone: "Asia/Seoul",
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    });
}

function todayKST(): string {
    return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
}

interface AdminHomeworkClientProps {
    homeworks: any[];
    schedules?: any[];
    studentDocId: string;
}

export default function AdminHomeworkClient({ homeworks, schedules = [], studentDocId }: AdminHomeworkClientProps) {
    const router = useRouter();
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [currentEditId, setCurrentEditId] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

    const [title, setTitle] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [assignedDate, setAssignedDate] = useState(todayKST());
    const [linkedScheduleId, setLinkedScheduleId] = useState<string>("");

    const [editTitle, setEditTitle] = useState("");
    const [editDueDate, setEditDueDate] = useState("");

    const handleAdd = async () => {
        if (!title || !dueDate || !assignedDate) return;

        startTransition(async () => {
            const result = await createHomework(studentDocId, {
                title,
                dueDate,
                assignedDate,
                ...(linkedScheduleId && { linkedScheduleId }),
            });

            if (result.success) {
                setIsAddOpen(false);
                setTitle("");
                setDueDate("");
                setAssignedDate(todayKST());
                setLinkedScheduleId("");
                router.refresh();
            } else {
                alert("숙제 부여 실패");
            }
        });
    };

    const handleEditClick = (hw: any) => {
        setCurrentEditId(hw.id);
        setEditTitle(hw.title);
        setEditDueDate(hw.dueDate);
        setIsEditOpen(true);
    };

    const handleUpdate = async () => {
        if (!currentEditId || !editTitle || !editDueDate) return;

        startTransition(async () => {
            const result = await updateHomework(currentEditId, studentDocId, {
                title: editTitle,
                dueDate: editDueDate
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
        if (!deleteTarget) return;
        const id = deleteTarget;
        setDeleteTarget(null);
        startTransition(async () => {
            const result = await deleteHomework(id, studentDocId);
            if (result.success) router.refresh();
        });
    };

    return (
        <div className="space-y-6 text-sm leading-relaxed">
            <PageHeader
                title="숙제 관리"
                description="학생에게 부여된 숙제를 관리하고 마감 상태를 확인할 수 있습니다."
                icon={
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-[#F0F3FF]">
                        <PenTool className="w-6 h-6 text-[#5D00E2]" />
                    </div>
                }
                actions={
                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                숙제 부여
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                        <DialogHeader><DialogTitle>새 숙제 부여</DialogTitle></DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-4">
                                <Label htmlFor="title" className="text-right whitespace-nowrap text-sm">숙제명</Label>
                                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예: 수학의 정석 p.50~55" />
                                <Label htmlFor="assignedDate" className="text-right whitespace-nowrap text-sm">부여일</Label>
                                <Input id="assignedDate" type="date" value={assignedDate} onChange={(e) => setAssignedDate(e.target.value)} />
                                <Label htmlFor="duedate" className="text-right whitespace-nowrap text-sm">마감일</Label>
                                <Input id="duedate" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                            </div>
                            {schedules.length > 0 && (
                                <div className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2">
                                    <Label htmlFor="linkedSchedule" className="text-right whitespace-nowrap text-sm">연관 수업</Label>
                                    <select
                                        id="linkedSchedule"
                                        value={linkedScheduleId}
                                        onChange={(e) => setLinkedScheduleId(e.target.value)}
                                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                                    >
                                        <option value="">선택 안 함 (마감일 23:59까지)</option>
                                        {schedules
                                            .filter((s: any) => s.status === "scheduled")
                                            .map((s: any) => (
                                                <option key={s.id} value={s.id}>
                                                    {s.date} {s.startTime} ~ {s.endTime} {s.topic ? `- ${s.topic}` : ""}
                                                </option>
                                            ))}
                                    </select>
                                    <div />
                                    <p className="text-xs text-muted-foreground">
                                        선택 시 해당 수업 시작 1시간 전에 제출 마감됩니다.
                                    </p>
                                </div>
                            )}
                        </div>
                        <DialogFooter>
                            <Button onClick={handleAdd} disabled={isPending}>
                                {isPending ? "부여 중..." : "추가하기"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
                }
            />

            {/* Edit Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>숙제 수정</DialogTitle></DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-4">
                                <Label htmlFor="edit-title" className="text-right whitespace-nowrap text-sm">숙제명</Label>
                                <Input id="edit-title" value={editTitle || ""} onChange={(e) => setEditTitle(e.target.value)} />
                                <Label htmlFor="edit-duedate" className="text-right whitespace-nowrap text-sm">마감일</Label>
                                <Input id="edit-duedate" type="date" value={editDueDate || ""} onChange={(e) => setEditDueDate(e.target.value)} />
                                {(() => {
                                    const editingHw = homeworks.find((h: any) => h.id === currentEditId);
                                    const linkedSchedule = editingHw?.linkedScheduleId && schedules.length > 0
                                        ? schedules.find((s: any) => s.id === editingHw.linkedScheduleId)
                                        : null;
                                    return (
                                        <>
                                            <Label className="text-right whitespace-nowrap text-sm text-muted-foreground">연관 수업</Label>
                                            <div className="text-sm">
                                                {linkedSchedule
                                                    ? `${linkedSchedule.date} ${linkedSchedule.startTime || ""} ~ ${linkedSchedule.endTime || ""}${linkedSchedule.topic ? ` - ${linkedSchedule.topic}` : ""}`
                                                    : "연관 수업 없음"}
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleUpdate} disabled={isPending}>
                                {isPending ? "수정 중..." : "수정하기"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

            <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
                <table className="w-full min-w-[700px] text-left text-sm">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-4 font-medium text-gray-500 whitespace-nowrap">숙제명</th>
                            <th className="p-4 font-medium text-gray-500 whitespace-nowrap">상태</th>
                            <th className="p-4 font-medium text-gray-500 whitespace-nowrap">부여일</th>
                            <th className="p-4 font-medium text-gray-500 whitespace-nowrap">마감일</th>
                            <th className="p-4 font-medium text-gray-500 whitespace-nowrap">제출일</th>
                            <th className="p-4 font-medium text-gray-500 text-right whitespace-nowrap">관리</th>
                        </tr>
                    </thead>
                    <tbody>
                        {homeworks.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="p-8 text-center text-gray-400">
                                    등록된 숙제가 없습니다.
                                </td>
                            </tr>
                        ) : (
                            homeworks.map((hw: any) => {
                                const today = todayKST();
                                const notSubmitted = hw.status !== 'submitted' && hw.status !== 'late-submitted';
                                const pastDeadline = notSubmitted && (today > hw.dueDate || isSubmissionLocked(hw));
                                const statusLabel = hw.status === 'submitted' ? '제출 완료' : hw.status === 'late-submitted' ? '지각 제출' : hw.status === 'expired' ? '기한 만료' : hw.status === 'overdue' ? '미완료' : pastDeadline ? '미완료' : '미제출';

                                return (
                                    <tr key={hw.id} className="border-b last:border-0 hover:bg-gray-50">
                                        <td className="p-4 font-medium whitespace-nowrap">{hw.title}</td>
                                        <td className="p-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <Badge variant={
                                                    hw.status === 'submitted' ? 'default' :
                                                        hw.status === 'late-submitted' ? 'destructive' : 'outline'
                                                } className={
                                                    hw.status === 'submitted' ? 'bg-green-600 hover:bg-green-700' :
                                                        hw.status === 'late-submitted' ? 'bg-yellow-500 hover:bg-yellow-600' :
                                                        pastDeadline ? 'bg-red-600 hover:bg-red-700' : ''
                                                }>
                                                    {statusLabel}
                                                </Badge>
                                                {pastDeadline && (
                                                    <Badge variant="destructive" className="bg-red-600 hover:bg-red-700">
                                                        제출기한 지남
                                                    </Badge>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 text-gray-500 whitespace-nowrap">{hw.assignedDate || "-"}</td>
                                        <td className={`p-4 whitespace-nowrap ${pastDeadline ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                                            {hw.dueDate}
                                        </td>
                                        <td className="p-4 text-gray-500 whitespace-nowrap">{hw.submittedDate ? formatDateTime(hw.submittedDate) : "-"}</td>
                                        <td className="p-4 text-right whitespace-nowrap">
                                            <Button variant="ghost" size="sm" onClick={() => handleEditClick(hw)}>
                                                수정
                                            </Button>
                                            <Button variant="ghost" size="sm" className="text-red-500" onClick={() => setDeleteTarget(hw.id)}>
                                                삭제
                                            </Button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>숙제 삭제</AlertDialogTitle>
                        <AlertDialogDescription>정말 이 숙제를 삭제하시겠습니까? 삭제된 숙제는 복구할 수 없습니다.</AlertDialogDescription>
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
