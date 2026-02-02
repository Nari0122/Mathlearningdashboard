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
    const [currentEditId, setCurrentEditId] = useState<number | null>(null);
    const [isPending, startTransition] = useTransition();

    const [title, setTitle] = useState("");
    const [dueDate, setDueDate] = useState("");

    const [editTitle, setEditTitle] = useState("");
    const [editDueDate, setEditDueDate] = useState("");

    const handleAdd = async () => {
        if (!title || !dueDate) return;

        startTransition(async () => {
            const today = new Date().toISOString().split('T')[0];
            const result = await createHomework(studentId, {
                title,
                dueDate,
                assignedDate: today
            });

            if (result.success) {
                setIsAddOpen(false);
                setTitle("");
                setDueDate("");
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

    const handleDelete = async (id: number) => {
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
                                <Input id="edit-title" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="edit-duedate" className="text-right">마감일</Label>
                                <Input id="edit-duedate" type="date" value={editDueDate} onChange={(e) => setEditDueDate(e.target.value)} className="col-span-3" />
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

            <div className="grid grid-cols-1 gap-4">
                {homeworks.length === 0 ? (
                    <div className="text-center py-20 bg-gray-50 rounded-lg border border-dashed">
                        <p className="text-gray-500">등록된 숙제가 없습니다.</p>
                    </div>
                ) : (
                    homeworks.map((hw: any) => (
                        <div key={hw.id} className="bg-white p-6 rounded-xl border border-gray-200 flex justify-between items-center">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-bold text-lg">{hw.title}</h3>
                                    <Badge variant={hw.status === 'submitted' ? 'secondary' : 'outline'}>
                                        {hw.status === 'submitted' ? '제출됨' : '진행중'}
                                    </Badge>
                                </div>
                                <p className="text-sm text-gray-500">마감일: {hw.dueDate}</p>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => handleEditClick(hw)}>
                                    수정
                                </Button>
                                <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDelete(hw.id)}>
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
