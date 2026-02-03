"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, AlertCircle, Plus, FileImage, X } from "lucide-react";
import { createIncorrectNote } from "@/actions/learning-actions";

interface StudentIncorrectNotesClientProps {
    studentId: number;
    notes: any[];
    units: any[];
}

export default function StudentIncorrectNotesClient({ studentId, notes, units }: StudentIncorrectNotesClientProps) {
    const router = useRouter();
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        unitId: "",
        problemName: "",
        memo: "",
        errorType: "C",
        questionImg: "",
    });

    const handleCreate = async () => {
        if (!formData.unitId || !formData.problemName) {
            alert("단원과 문제명을 입력해주세요.");
            return;
        }

        setIsLoading(true);
        const result = await createIncorrectNote(studentId, {
            unitId: parseInt(formData.unitId),
            problemName: formData.problemName,
            memo: formData.memo,
            errorType: formData.errorType,
            questionImg: formData.questionImg
        });
        setIsLoading(false);

        if (result.success) {
            alert("오답노트가 등록되었습니다.");
            setIsAddOpen(false);
            setFormData({
                unitId: "",
                problemName: "",
                memo: "",
                errorType: "C",
                questionImg: "",
            });
            router.refresh();
        } else {
            alert(result.message);
        }
    };

    const errorTypeMap: Record<string, string> = {
        'C': '개념(C)',
        'M': '계산(M)',
        'R': '독해(R)',
        'S': '전략(S)'
    };

    const errorColorMap: Record<string, string> = {
        'C': 'bg-blue-100 text-blue-800',
        'M': 'bg-red-100 text-red-800',
        'R': 'bg-orange-100 text-orange-800',
        'S': 'bg-purple-100 text-purple-800'
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold tracking-tight">오답 노트 ({notes.length})</h2>
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-blue-600 hover:bg-blue-700">
                            <Plus className="mr-2 h-4 w-4" />
                            오답노트 작성
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                            <DialogTitle>오답노트 작성</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label>단원 선택</Label>
                                <Select value={formData.unitId} onValueChange={(val) => setFormData({ ...formData, unitId: val })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="단원을 선택하세요" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {units.map((unit) => (
                                            <SelectItem key={unit.id} value={unit.id.toString()}>
                                                {unit.name} ({unit.grade})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>문제명/번호</Label>
                                <Input
                                    placeholder="예: 쎈 123번, 3월 모의고사 21번"
                                    value={formData.problemName}
                                    onChange={(e) => setFormData({ ...formData, problemName: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>오답 유형</Label>
                                <Select value={formData.errorType} onValueChange={(val) => setFormData({ ...formData, errorType: val })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="C">개념(C) - 공식이나 정의를 모름</SelectItem>
                                        <SelectItem value="M">계산(M) - 풀이 과정 중 실수</SelectItem>
                                        <SelectItem value="R">독해(R) - 문제 요구사항 해석 오류</SelectItem>
                                        <SelectItem value="S">전략(S) - 접근 방법 못 찾음</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>메모 / 풀이</Label>
                                <Textarea
                                    placeholder="틀린 이유나 올바른 풀이 과정을 기록하세요."
                                    className="h-32"
                                    value={formData.memo}
                                    onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>이미지 첨부 (선택)</Label>
                                <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            const reader = new FileReader();
                                            reader.onloadend = () => {
                                                setFormData({ ...formData, questionImg: reader.result as string });
                                            };
                                            reader.readAsDataURL(file);
                                        }
                                    }}
                                />
                                {formData.questionImg && (
                                    <div className="mt-2 relative h-32 w-full bg-gray-50 rounded border border-gray-200">
                                        <img
                                            src={formData.questionImg}
                                            alt="Priview"
                                            className="h-full w-full object-contain"
                                        />
                                        <button
                                            onClick={() => setFormData({ ...formData, questionImg: "" })}
                                            className="absolute top-1 right-1 bg-gray-900/50 text-white rounded-full p-1 hover:bg-gray-900"
                                            type="button"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAddOpen(false)}>취소</Button>
                            <Button onClick={handleCreate} disabled={isLoading}>등록</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {notes.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                    <AlertCircle className="mx-auto h-10 w-10 text-gray-400 mb-4" />
                    <p className="text-gray-500 font-medium">작성된 오답 노트가 없습니다.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {notes.map((note) => (
                        <Card key={note.id} className="overflow-hidden">
                            <CardHeader className="bg-gray-50/50 pb-0">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="bg-white">
                                                {note.unit?.name || "단원 미지정"}
                                            </Badge>
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${errorColorMap[note.errorType] || 'bg-gray-100 text-gray-800'}`}>
                                                {errorTypeMap[note.errorType] || note.errorType}
                                            </span>
                                            {note.isResolved && (
                                                <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100">
                                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                                    해결됨
                                                </Badge>
                                            )}
                                        </div>
                                        <CardTitle className="text-base font-bold text-gray-900 mt-0">
                                            {note.problemName || "문제 이름 없음"}
                                        </CardTitle>
                                    </div>
                                    <div className="text-xs text-gray-400">
                                        {new Date(note.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-1">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <h4 className="text-sm font-semibold text-gray-700">문제 메모</h4>
                                        <div className="bg-yellow-50/50 p-4 rounded-lg border border-yellow-100 min-h-[100px] text-sm text-gray-700 whitespace-pre-wrap">
                                            {note.memo || "메모가 없습니다."}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <h4 className="text-sm font-semibold text-gray-700">이미지 첨부</h4>
                                        {note.questionImg ? (
                                            <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200 group">
                                                <div className="flex items-center justify-center h-full text-gray-400">
                                                    <img
                                                        src={note.questionImg}
                                                        alt="문제 이미지"
                                                        className="w-full h-full object-contain"
                                                        onError={(e) => (e.currentTarget.style.display = 'none')}
                                                    />
                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button variant="secondary" size="sm" className="pointer-events-none">확대보기</Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-[120px] bg-gray-50 rounded-lg border border-dashed border-gray-200 text-gray-400">
                                                <FileImage className="h-8 w-8 mb-2 opacity-50" />
                                                <span className="text-xs">이미지 없음</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
