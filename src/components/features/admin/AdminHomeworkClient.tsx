"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createHomework, updateHomework, deleteHomework } from "@/actions/admin-actions";
import { useRouter } from "next/navigation";

interface AdminHomeworkClientProps {
    homeworks: any[];
    studentId: number;
}

export default function AdminHomeworkClient({ homeworks, studentId }: AdminHomeworkClientProps) {
    const router = useRouter();
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [currentEditId, setCurrentEditId] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const [title, setTitle] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [assignedDate, setAssignedDate] = useState(new Date().toISOString().split('T')[0]); // Default to today

    const [editTitle, setEditTitle] = useState("");
    const [editDueDate, setEditDueDate] = useState("");

    const handleAdd = async () => {
        if (!title || !dueDate || !assignedDate) return;

        startTransition(async () => {
            const result = await createHomework(studentId, {
                title,
                dueDate,
                assignedDate // Use user input
            });

            if (result.success) {
                setIsAddOpen(false);
                setTitle("");
                setDueDate("");
                setAssignedDate(new Date().toISOString().split('T')[0]); // Reset to today
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
            const result = await updateHomework(currentEditId, studentId, {
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

    const handleDelete = async (id: string) => {
        if (!confirm("정말 삭제하시겠습니까?")) return;
        startTransition(async () => {
            const result = await deleteHomework(id, studentId);
            if (result.success) {
                router.refresh();
            } else {
                alert("삭제 실패");
            }
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">숙제 관리</h2>
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button><Plus className="mr-2 h-4 w-4" /> 숙제 부여</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>새 숙제 부여</DialogTitle></DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="title" className="text-right">숙제명</Label>
                                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="col-span-3" placeholder="예: 수학의 정석 p.50~55" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="assignedDate" className="text-right">부여일</Label>
                                <Input id="assignedDate" type="date" value={assignedDate} onChange={(e) => setAssignedDate(e.target.value)} className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="duedate" className="text-right">마감일</Label>
                                <Input id="duedate" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="col-span-3" />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleAdd} disabled={isPending}>
                                {isPending ? "부여 중..." : "추가하기"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Edit Dialog */}
                <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                    <DialogContent>
                        <DialogHeader><DialogTitle>숙제 수정</DialogTitle></DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="edit-title" className="text-right">숙제명</Label>
                                <Input id="edit-title" value={editTitle || ""} onChange={(e) => setEditTitle(e.target.value)} className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="edit-duedate" className="text-right">마감일</Label>
                                <Input id="edit-duedate" type="date" value={editDueDate || ""} onChange={(e) => setEditDueDate(e.target.value)} className="col-span-3" />
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

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-4 font-medium text-gray-500">숙제명</th>
                            <th className="p-4 font-medium text-gray-500">상태</th>
                            <th className="p-4 font-medium text-gray-500">부여일</th>
                            <th className="p-4 font-medium text-gray-500">마감일</th>
                            <th className="p-4 font-medium text-gray-500">제출일</th>
                            <th className="p-4 font-medium text-gray-500 text-right">관리</th>
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
                                const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' });
                                const isOverdue = today > hw.dueDate && hw.status !== 'submitted' && hw.status !== 'late-submitted';

                                return (
                                    <tr key={hw.id} className="border-b last:border-0 hover:bg-gray-50">
                                        <td className="p-4 font-medium">{hw.title}</td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <Badge variant={
                                                    hw.status === 'submitted' ? 'default' :
                                                        hw.status === 'late-submitted' ? 'destructive' : 'outline'
                                                } className={
                                                    hw.status === 'submitted' ? 'bg-green-600 hover:bg-green-700' :
                                                        hw.status === 'late-submitted' ? 'bg-yellow-500 hover:bg-yellow-600' : ''
                                                }>
                                                    {hw.status === 'submitted' ? '제출 완료' :
                                                        hw.status === 'late-submitted' ? '지각 제출' : '미제출'}
                                                </Badge>
                                                {isOverdue && (
                                                    <Badge variant="destructive" className="bg-red-600 hover:bg-red-700">
                                                        마감됨
                                                    </Badge>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 text-gray-500">{hw.assignedDate || "-"}</td>
                                        <td className={`p-4 ${isOverdue ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                                            {hw.dueDate}
                                        </td>
                                        <td className="p-4 text-gray-500">{hw.submittedDate || "-"}</td>
                                        <td className="p-4 text-right flex justify-end gap-2">
                                            <Button variant="ghost" size="sm" onClick={() => handleEditClick(hw)}>
                                                수정
                                            </Button>
                                            <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDelete(hw.id)}>
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
        </div>
    );
}
