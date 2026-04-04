"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, Pencil, Trash, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createExam, updateExam, deleteExam } from "@/actions/learning-actions";
import { useRouter } from "next/navigation";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PageHeader } from "@/components/shared/PageHeader";

interface AdminExamsClientProps {
    exams: any[];
    studentDocId: string;
}

type ExamTypeFilter = "mock" | "school";

export default function AdminExamsClient({ exams: initialExams, studentDocId }: AdminExamsClientProps) {
    const router = useRouter();
    const [exams, setExams] = useState(initialExams);
    useEffect(() => { setExams(initialExams); }, [initialExams]);

    const [activeTab, setActiveTab] = useState<ExamTypeFilter>("school");
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [currentEditId, setCurrentEditId] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

    const [examType, setExamType] = useState("");
    const [subject, setSubject] = useState("수학");
    const [score, setScore] = useState("");
    const [date, setDate] = useState("");
    const [type, setType] = useState<ExamTypeFilter>("school");

    const [editExamType, setEditExamType] = useState("");
    const [editSubject, setEditSubject] = useState("");
    const [editScore, setEditScore] = useState("");
    const [editDate, setEditDate] = useState("");
    const [editType, setEditType] = useState<ExamTypeFilter>("school");

    const filteredExams = useMemo(
        () => exams.filter((e: any) => (e.type || "school") === activeTab),
        [exams, activeTab]
    );

    const mockCount = useMemo(() => exams.filter((e: any) => e.type === "mock").length, [exams]);
    const schoolCount = useMemo(() => exams.filter((e: any) => (e.type || "school") === "school").length, [exams]);

    const handleAdd = async () => {
        if (!examType || !date || !score) return;

        setIsAddOpen(false);
        const saved = { score, date, examType, subject, type };
        setScore("");
        setDate("");

        createExam(studentDocId, {
            examType: saved.examType,
            subject: saved.subject,
            date: saved.date,
            score: parseInt(saved.score),
            type: saved.type
        }).then((result) => {
            if (result.success) {
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
        setEditType(exam.type || "school");
        setIsEditOpen(true);
    };

    const handleUpdate = async () => {
        if (!currentEditId || !editScore || !editDate) return;

        setIsEditOpen(false);

        updateExam(currentEditId, studentDocId, {
            examType: editExamType,
            subject: editSubject,
            score: parseInt(editScore),
            date: editDate,
            type: editType
        }).then((result) => {
            if (result.success) {
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
        setExams(prev => prev.filter((e: any) => e.id !== id));

        deleteExam(id, studentDocId).then((result) => {
            if (result.success) router.refresh();
        });
    };

    const TypeBadge = ({ examTypeValue }: { examTypeValue: string }) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
            examTypeValue === "mock"
                ? "bg-blue-100 text-blue-700"
                : "bg-green-100 text-green-700"
        }`}>
            {examTypeValue === "mock" ? "모의고사" : "학교 시험"}
        </span>
    );

    const TypeSelector = ({ value, onChange }: { value: ExamTypeFilter; onChange: (v: ExamTypeFilter) => void }) => (
        <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
            <Label className="text-right sm:text-right">시험 유형</Label>
            <div className="col-span-1 sm:col-span-3 flex gap-2">
                <button
                    type="button"
                    onClick={() => onChange("school")}
                    className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-colors min-h-[44px] ${
                        value === "school"
                            ? "border-green-500 bg-green-50 text-green-700"
                            : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                    }`}
                >
                    학교 시험
                </button>
                <button
                    type="button"
                    onClick={() => onChange("mock")}
                    className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-colors min-h-[44px] ${
                        value === "mock"
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                    }`}
                >
                    모의고사
                </button>
            </div>
        </div>
    );

    return (
        <div className="space-y-6 text-sm leading-relaxed">
            <PageHeader
                title="시험 성적 관리"
                description="학생의 시험 성적을 입력하고 성적 변화를 그래프로 확인합니다."
                icon={
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-[#F0F3FF]">
                        <BarChart3 className="w-6 h-6 text-[#5D00E2]" />
                    </div>
                }
                actions={
                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" /> 성적 추가
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-h-[90vh] overflow-y-auto">
                            <DialogHeader><DialogTitle>새 성적 추가</DialogTitle></DialogHeader>
                        <div className="grid gap-4 py-4">
                            <TypeSelector value={type} onChange={setType} />
                            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                                <Label htmlFor="type" className="text-right sm:text-right">시험 구분</Label>
                                <Input
                                    id="type"
                                    value={examType}
                                    onChange={(e) => setExamType(e.target.value)}
                                    className="col-span-1 sm:col-span-3 min-h-[44px]"
                                    placeholder={type === "mock" ? "예: 3월 모의고사, 6월 모의고사" : "예: 1학기 중간고사, 단원평가"}
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
                            <Button onClick={handleAdd}>
                                추가하기
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
                }
            />

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
                <button
                    onClick={() => setActiveTab("school")}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        activeTab === "school"
                            ? "bg-white text-green-700 shadow-sm"
                            : "text-gray-500 hover:text-gray-700"
                    }`}
                >
                    학교 시험
                    <span className={`ml-1.5 inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-xs ${
                        activeTab === "school" ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-500"
                    }`}>
                        {schoolCount}
                    </span>
                </button>
                <button
                    onClick={() => setActiveTab("mock")}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        activeTab === "mock"
                            ? "bg-white text-blue-700 shadow-sm"
                            : "text-gray-500 hover:text-gray-700"
                    }`}
                >
                    모의고사
                    <span className={`ml-1.5 inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-xs ${
                        activeTab === "mock" ? "bg-blue-100 text-blue-700" : "bg-gray-200 text-gray-500"
                    }`}>
                        {mockCount}
                    </span>
                </button>
            </div>

            {/* Edit Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="max-h-[90vh] overflow-y-auto">
                    <DialogHeader><DialogTitle>성적 수정</DialogTitle></DialogHeader>
                        <div className="grid gap-4 py-4">
                            <TypeSelector value={editType} onChange={setEditType} />
                            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                                <Label htmlFor="edit-type" className="text-right sm:text-right">시험 구분</Label>
                                <Input
                                    id="edit-type"
                                    value={editExamType || ""}
                                    onChange={(e) => setEditExamType(e.target.value)}
                                    className="col-span-1 sm:col-span-3 min-h-[44px]"
                                    placeholder={editType === "mock" ? "예: 3월 모의고사, 6월 모의고사" : "예: 1학기 중간고사, 단원평가"}
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
                            <Button onClick={handleUpdate}>
                                수정하기
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

            {/* Score Trend Graph */}
            {filteredExams.length > 0 && (
                <div className="bg-white p-6 rounded-xl border border-gray-200">
                    <h3 className="text-lg font-bold mb-4">
                        {activeTab === "mock" ? "모의고사" : "학교 시험"} 성적 변화 추이
                    </h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={[...filteredExams].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())}>
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
                                    stroke={activeTab === "mock" ? "#2563eb" : "#16a34a"}
                                    strokeWidth={2}
                                    dot={{ r: 4, fill: activeTab === "mock" ? "#2563eb" : "#16a34a" }}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
                <table className="w-full min-w-[600px] text-left text-sm">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-4 font-medium text-gray-500">유형</th>
                            <th className="p-4 font-medium text-gray-500">시험명</th>
                            <th className="p-4 font-medium text-gray-500">점수</th>
                            <th className="p-4 font-medium text-gray-500">날짜</th>
                            <th className="p-4 font-medium text-gray-500 text-right">관리</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredExams.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-gray-400">
                                    등록된 {activeTab === "mock" ? "모의고사" : "학교 시험"} 성적이 없습니다.
                                </td>
                            </tr>
                        ) : (
                            filteredExams.map((exam: any) => (
                                <tr key={exam.id} className="border-b last:border-0 hover:bg-gray-50">
                                    <td className="p-4">
                                        <TypeBadge examTypeValue={exam.type || "school"} />
                                    </td>
                                    <td className="p-4 font-medium">{exam.examType}</td>
                                    <td className="p-4 font-bold text-blue-600">{exam.score}점</td>
                                    <td className="p-4 text-gray-500">{exam.date}</td>
                                    <td className="p-4 text-right flex justify-end gap-2">
                                        <Button variant="ghost" size="sm" onClick={() => handleEditClick(exam)}>
                                            수정
                                        </Button>
                                        <Button variant="ghost" size="sm" className="text-red-500" onClick={() => setDeleteTarget(exam.id)}>
                                            삭제
                                        </Button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>성적 삭제</AlertDialogTitle>
                        <AlertDialogDescription>정말 이 성적 기록을 삭제하시겠습니까? 삭제된 기록은 복구할 수 없습니다.</AlertDialogDescription>
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
