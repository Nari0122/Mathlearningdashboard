"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createExam, updateExam, deleteExam } from "@/actions/learning-actions";
import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Optional if we want select
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface AdminExamsClientProps {
    exams: any[];
    studentDocId: string;
}

const EXAM_TYPES = ["중간고사", "기말고사", "모의고사", "단원평가", "기타"];
const SUBJECTS = ["수학", "영어", "국어", "과학", "사회", "공통수학1", "공통수학2", "미적분", "확률과통계", "기하"];

export default function AdminExamsClient({ exams, studentDocId }: AdminExamsClientProps) {
    const router = useRouter();
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [currentEditId, setCurrentEditId] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const [examType, setExamType] = useState("");
    const [subject, setSubject] = useState("수학");
    const [score, setScore] = useState("");
    const [date, setDate] = useState("");

    const [editExamType, setEditExamType] = useState("");
    const [editSubject, setEditSubject] = useState("");
    const [editScore, setEditScore] = useState("");
    const [editDate, setEditDate] = useState("");

    const handleAdd = async () => {
        if (!examType || !date || !score) return;

        startTransition(async () => {
            const result = await createExam(studentDocId, {
                examType,
                subject,
                date,
                score: parseInt(score)
            });

            if (result.success) {
                setIsAddOpen(false);
                setScore("");
                setDate("");
                router.refresh();
            } else {
                alert("성적 추가 실패");
            }
        });
    };

    const handleEditClick = (exam: any) => {
        setCurrentEditId(exam.id);
        setEditExamType(exam.examType);
        setEditSubject(exam.subject);
        setEditScore(exam.score.toString());
        setEditDate(exam.date);
        setIsEditOpen(true);
    };

    const handleUpdate = async () => {
        if (!currentEditId || !editScore || !editDate) return;

        startTransition(async () => {
            const result = await updateExam(currentEditId, studentDocId, {
                examType: editExamType,
                subject: editSubject,
                score: parseInt(editScore),
                date: editDate
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
            const result = await deleteExam(id, studentDocId);
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
                <h2 className="text-xl font-bold">시험 성적 관리</h2>
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button><Plus className="mr-2 h-4 w-4" /> 성적 추가</Button>
                    </DialogTrigger>
                    <DialogContent className="max-h-[90vh] overflow-y-auto">
                        <DialogHeader><DialogTitle>새 성적 추가</DialogTitle></DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                                <Label htmlFor="type" className="text-right sm:text-right">시험 구분</Label>
                                <Input
                                    id="type"
                                    value={examType}
                                    onChange={(e) => setExamType(e.target.value)}
                                    className="col-span-1 sm:col-span-3 min-h-[44px]"
                                    placeholder="예: 1학기 중간고사, 3월 모의고사, 단원평가"
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                                <Label htmlFor="score" className="text-right sm:text-right">점수</Label>
                                <Input id="score" type="number" value={score} onChange={(e) => setScore(e.target.value)} className="col-span-1 sm:col-span-3 min-h-[44px]" placeholder="점수 입력" />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                                <Label htmlFor="date" className="text-right sm:text-right">날짜</Label>
                                <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="col-span-1 sm:col-span-3 min-h-[44px] w-full touch-manipulation" />
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
                    <DialogContent className="max-h-[90vh] overflow-y-auto">
                        <DialogHeader><DialogTitle>성적 수정</DialogTitle></DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                                <Label htmlFor="edit-type" className="text-right sm:text-right">시험 구분</Label>
                                <Input
                                    id="edit-type"
                                    value={editExamType || ""}
                                    onChange={(e) => setEditExamType(e.target.value)}
                                    className="col-span-1 sm:col-span-3 min-h-[44px]"
                                    placeholder="예: 1학기 중간고사, 3월 모의고사, 단원평가"
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                                <Label htmlFor="edit-score" className="text-right sm:text-right">점수</Label>
                                <Input id="edit-score" type="number" value={editScore || ""} onChange={(e) => setEditScore(e.target.value)} className="col-span-1 sm:col-span-3 min-h-[44px]" placeholder="점수 입력" />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                                <Label htmlFor="edit-date" className="text-right sm:text-right">날짜</Label>
                                <Input id="edit-date" type="date" value={editDate || ""} onChange={(e) => setEditDate(e.target.value)} className="col-span-1 sm:col-span-3 min-h-[44px] w-full touch-manipulation" />
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

            {/* Score Trend Graph */}
            {exams.length > 0 && (
                <div className="bg-white p-6 rounded-xl border border-gray-200">
                    <h3 className="text-lg font-bold mb-4">성적 변화 추이</h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={[...exams].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    tick={{ fontSize: 12 }}
                                    tickFormatter={(value) => new Date(value).toLocaleDateString()}
                                />
                                <YAxis domain={[0, 100]} />
                                <Tooltip
                                    content={({ active, payload, label }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="bg-white p-2 border border-gray-200 shadow-md rounded-md text-sm">
                                                    <p className="font-bold">{label}</p>
                                                    <p>{payload[0].payload.examType}: {payload[0].value}점</p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="score"
                                    stroke="#4f46e5"
                                    strokeWidth={2}
                                    dot={{ r: 4, fill: "#4f46e5" }}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-4 font-medium text-gray-500">시험명</th>
                            <th className="p-4 font-medium text-gray-500">점수</th>
                            <th className="p-4 font-medium text-gray-500">날짜</th>
                            <th className="p-4 font-medium text-gray-500 text-right">관리</th>
                        </tr>
                    </thead>
                    <tbody>
                        {exams.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="p-8 text-center text-gray-400">
                                    등록된 시험 성적이 없습니다.
                                </td>
                            </tr>
                        ) : (
                            exams.map((exam: any) => (
                                <tr key={exam.id} className="border-b last:border-0 hover:bg-gray-50">
                                    <td className="p-4 font-medium">{exam.examType}</td>
                                    <td className="p-4 font-bold text-blue-600">{exam.score}점</td>
                                    <td className="p-4 text-gray-500">{exam.date}</td>
                                    <td className="p-4 text-right flex justify-end gap-2">
                                        <Button variant="ghost" size="sm" onClick={() => handleEditClick(exam)}>
                                            수정
                                        </Button>
                                        <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDelete(exam.id)}>
                                            삭제
                                        </Button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
