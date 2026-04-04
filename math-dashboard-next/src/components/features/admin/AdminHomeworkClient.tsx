"use client";

import { useState, useEffect } from "react";
import { Plus, PenTool, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createHomework, updateHomework, deleteHomework, updateHomeworkProgress } from "@/actions/admin-actions";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";

const PROGRESS_OPTIONS = [
    { value: "none", label: "안 함", textClass: "text-red-600" },
    { value: "little", label: "조금", textClass: "text-orange-500" },
    { value: "half", label: "절반", textClass: "text-yellow-600" },
    { value: "almost", label: "거의 다", textClass: "text-lime-600" },
    { value: "done", label: "완료", textClass: "text-green-600" },
] as const;

function getProgressTextClass(progress: string) {
    return PROGRESS_OPTIONS.find(o => o.value === progress)?.textClass || "text-gray-500";
}

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

export default function AdminHomeworkClient({ homeworks: initialHomeworks, schedules = [], studentDocId }: AdminHomeworkClientProps) {
    const router = useRouter();
    const [homeworks, setHomeworks] = useState(initialHomeworks);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [currentEditId, setCurrentEditId] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

    useEffect(() => {
        setHomeworks(initialHomeworks);
    }, [initialHomeworks]);

    const [title, setTitle] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [assignedDate, setAssignedDate] = useState(todayKST());
    const [linkedScheduleId, setLinkedScheduleId] = useState<string>("");

    const [editTitle, setEditTitle] = useState("");
    const [editDueDate, setEditDueDate] = useState("");

    const handleAdd = async () => {
        if (!title || !dueDate || !assignedDate) return;

        setIsAddOpen(false);
        const savedTitle = title;
        const savedDueDate = dueDate;
        const savedAssignedDate = assignedDate;
        const savedLinkedScheduleId = linkedScheduleId;
        setTitle("");
        setDueDate("");
        setAssignedDate(todayKST());
        setLinkedScheduleId("");

        createHomework(studentDocId, {
            title: savedTitle,
            dueDate: savedDueDate,
            assignedDate: savedAssignedDate,
            ...(savedLinkedScheduleId && { linkedScheduleId: savedLinkedScheduleId }),
        }).then(result => {
            if (result.success) {
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

        setIsEditOpen(false);
        const savedEditId = currentEditId;
        const savedEditTitle = editTitle;
        const savedEditDueDate = editDueDate;

        updateHomework(savedEditId, studentDocId, {
            title: savedEditTitle,
            dueDate: savedEditDueDate
        }).then(result => {
            if (result.success) {
                router.refresh();
            } else {
                alert("수정 실패");
            }
        });
    };

    const handleProgressChange = (hwId: string, newProgress: string) => {
        setHomeworks(prev =>
            prev.map(hw =>
                hw.id === hwId
                    ? { ...hw, progress: newProgress, progressChangedByAdmin: true }
                    : hw
            )
        );

        updateHomeworkProgress(hwId, studentDocId, newProgress as any, true).then(result => {
            if (result.success) {
                router.refresh();
            } else {
                alert("진척도 변경 실패");
                router.refresh();
            }
        });
    };

    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return;
        const id = deleteTarget;
        setDeleteTarget(null);

        setHomeworks(prev => prev.filter(hw => hw.id !== id));

        deleteHomework(id, studentDocId).then(result => {
            if (result.success) {
                router.refresh();
            }
        });
    };

    return (
        <div className="space-y-6 text-sm leading-relaxed">
            <PageHeader
                title="숙제 관리"
                description="학생에게 부여된 숙제를 관리하고 진척도를 확인할 수 있습니다."
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
                            <Button onClick={handleAdd}>
                                추가하기
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
                            <Button onClick={handleUpdate}>
                                수정하기
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

            <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
                <table className="w-full min-w-[700px] text-left text-sm">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-4 font-medium text-gray-500 whitespace-nowrap">숙제명</th>
                            <th className="p-4 font-medium text-gray-500 whitespace-nowrap">진척도</th>
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
                                const currentProgress = hw.progress || "none";
                                const pastDeadline = currentProgress !== "done" && today > hw.dueDate;

                                return (
                                    <tr key={hw.id} className="border-b last:border-0 hover:bg-gray-50">
                                        <td className="p-4 font-medium whitespace-nowrap">
                                            <span className={currentProgress === "done" ? "line-through text-gray-400" : ""}>
                                                {hw.title}
                                            </span>
                                        </td>
                                        <td className="p-4 whitespace-nowrap">
                                            <div className="flex items-center gap-1.5">
                                                <select
                                                    value={currentProgress}
                                                    onChange={(e) => handleProgressChange(hw.id, e.target.value)}
                                                    className={`h-8 rounded-md border border-gray-300 bg-white px-2 text-sm font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-400 ${getProgressTextClass(currentProgress)}`}
                                                >
                                                    {PROGRESS_OPTIONS.map(opt => (
                                                        <option key={opt.value} value={opt.value}>
                                                            {opt.label}
                                                        </option>
                                                    ))}
                                                </select>
                                                {hw.progressChangedByAdmin && (
                                                    <Lock className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 text-gray-500 whitespace-nowrap">{hw.assignedDate || "-"}</td>
                                        <td className={`p-4 whitespace-nowrap ${pastDeadline ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                                            {hw.dueDate}
                                        </td>
                                        <td className="p-4 text-gray-500 whitespace-nowrap">
                                            {hw.submittedDate ? formatDateTime(hw.submittedDate) : "-"}
                                            {hw.isLateUpdate && hw.lastModifiedDate && (
                                                <div className="text-[11px] text-amber-600 mt-0.5">
                                                    ⚠️ 마감 후 수정됨 ({formatDateTime(hw.lastModifiedDate)})
                                                </div>
                                            )}
                                        </td>
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
