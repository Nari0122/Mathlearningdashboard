"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { addIncorrectNote, deleteNote } from "@/actions/note-actions";

export default function IncorrectNotesClient({ notes, units, userId }: { notes: any[], units: any[], userId: number }) {
    // Add Note State
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [formData, setFormData] = useState({ unitId: "", problemName: "", errorType: "C", memo: "" });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    // Filter State
    const [selectedUnit, setSelectedUnit] = useState<string>("all");

    // Delete Confirmation State
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [noteToDelete, setNoteToDelete] = useState<string | null>(null);

    const filteredNotes = notes.filter(note => {
        if (selectedUnit === "all") return true;
        return note.unitId.toString() === selectedUnit;
    });

    const handleSubmit = async () => {
        if (!formData.unitId || !formData.problemName) return;

        let questionImg = "";

        // Handle File Upload
        if (selectedFile) {
            setIsUploading(true);
            const uploadData = new FormData();
            uploadData.append("file", selectedFile);

            try {
                const res = await fetch("/api/upload", {
                    method: "POST",
                    body: uploadData,
                });
                const result = await res.json();
                if (result.success) {
                    questionImg = result.url;
                }
            } catch (error) {
                console.error("Upload failed", error);
            } finally {
                setIsUploading(false);
            }
        }

        await addIncorrectNote(userId, parseInt(formData.unitId), formData.problemName, formData.errorType, formData.memo, questionImg);
        setIsAddOpen(false);
        setFormData({ unitId: "", problemName: "", errorType: "C", memo: "" });
        setSelectedFile(null);
    };

    const handleDeleteClick = (noteId: string) => {
        setNoteToDelete(noteId);
        setIsDeleteConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (noteToDelete) {
            await deleteNote(userId, noteToDelete);
        }
        setIsDeleteConfirmOpen(false);
        setNoteToDelete(null);
    };

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">오답노트</h1>
                    <p className="text-gray-500 mt-1">틀린 문제를 기록하고 원인을 분석해보세요.</p>
                </div>

                <div className="flex gap-4">
                    <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="단원별 보기" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">전체 단원</SelectItem>
                            {units.map(u => (
                                <SelectItem key={u.id} value={u.id.toString()}>{u.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> 오답 추가</Button></DialogTrigger>
                        <DialogContent>
                            <DialogHeader><DialogTitle>오답 노트 작성</DialogTitle></DialogHeader>
                            <div className="space-y-4 py-2">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">단원 선택</label>
                                    <Select onValueChange={(val) => setFormData({ ...formData, unitId: val })}>
                                        <SelectTrigger><SelectValue placeholder="단원 선택" /></SelectTrigger>
                                        <SelectContent>
                                            {units.map(u => <SelectItem key={u.id} value={u.id.toString()}>{u.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">문제 정보</label>
                                    <Input placeholder="예: 쎈수학 124번" value={formData.problemName} onChange={e => setFormData({ ...formData, problemName: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">문제 사진 (선택)</label>
                                    <Input type="file" accept="image/*" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">오류 유형</label>
                                    <Select defaultValue="C" onValueChange={(val) => setFormData({ ...formData, errorType: val })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="C">개념(C)</SelectItem>
                                            <SelectItem value="M">계산(M)</SelectItem>
                                            <SelectItem value="R">독해(R)</SelectItem>
                                            <SelectItem value="S">전략(S)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">메모/풀이</label>
                                    <Textarea placeholder="틀린 이유나 풀이 과정을 적어보세요" value={formData.memo} onChange={e => setFormData({ ...formData, memo: e.target.value })} />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleSubmit} disabled={isUploading}>
                                    {isUploading ? "업로드 중..." : "저장하기"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="grid gap-4">
                {filteredNotes.length === 0 ? (
                    <div className="text-center py-20 bg-gray-50 rounded-xl">
                        <p className="text-gray-500">작성된 오답노트가 없습니다.</p>
                    </div>
                ) : (
                    filteredNotes.map((note) => (
                        <div key={note.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Badge variant="outline" className="bg-white">{note.unit?.name}</Badge>
                                        <Badge className={
                                            note.errorType === 'C' ? 'bg-blue-100 text-blue-700' :
                                                note.errorType === 'M' ? 'bg-red-100 text-red-700' :
                                                    note.errorType === 'R' ? 'bg-orange-100 text-orange-700' : 'bg-purple-100 text-purple-700'
                                        }>
                                            {note.errorType}
                                        </Badge>
                                        <h3 className="font-bold text-lg text-gray-900">{note.problemName}</h3>
                                    </div>

                                    {note.questionImg && (
                                        <div className="my-3">
                                            <img src={note.questionImg} alt="Problem" className="max-w-full sm:max-w-md rounded-lg border border-gray-200" />
                                        </div>
                                    )}

                                    <p className="text-gray-600 whitespace-pre-wrap">{note.memo}</p>
                                    <p className="text-xs text-gray-400 mt-2" suppressHydrationWarning>{new Date(note.createdAt).toLocaleDateString()}</p>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(note.id)} className="text-gray-400 hover:text-red-500 flex-shrink-0">
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Delete Confirmation Modal using Standard Dialog */}
            <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>정말로 삭제하시겠습니까?</DialogTitle>
                        <DialogDescription>
                            삭제된 오답노트는 복구할 수 없습니다.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>취소</Button>
                        <Button variant="destructive" onClick={handleConfirmDelete} className="bg-red-500 hover:bg-red-600">삭제하기</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
