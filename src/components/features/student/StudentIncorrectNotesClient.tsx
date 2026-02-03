"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, AlertCircle, Plus, FileImage, X, Trash2, Pencil } from "lucide-react";
import { createIncorrectNote, deleteIncorrectNote, updateIncorrectNote } from "@/actions/learning-actions";
import { SCHOOL_LEVELS, GRADES, SUBJECTS, getUnits, CURRICULUM_DATA, isMiddleSchool } from "@/lib/curriculum-data";

interface StudentIncorrectNotesClientProps {
    studentId: number;
    notes: any[];
    units: any[];
}

export default function StudentIncorrectNotesClient({ studentId, notes, units }: StudentIncorrectNotesClientProps) {
    const router = useRouter();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
    const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
    const [selectedZoomImg, setSelectedZoomImg] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Filter State (for notes list)
    const [filterLevel, setFilterLevel] = useState<string>("all");
    const [filterGrade, setFilterGrade] = useState<string>("all");
    const [filterSubject, setFilterSubject] = useState<string>("all");
    const [filterUnitName, setFilterUnitName] = useState<string>("all");
    const [filterDetail, setFilterDetail] = useState<string>("all");

    // 5-Level Selection State (for Add Modal)
    const [selLevel, setSelLevel] = useState<string>("");
    const [selGrade, setSelGrade] = useState<string>("");
    const [selSubject, setSelSubject] = useState<string>("");
    const [selUnitName, setSelUnitName] = useState<string>("");
    const [selDetail, setSelDetail] = useState<string>("");

    // Reset logic for modal
    useEffect(() => { setSelGrade(""); setSelSubject(""); setSelUnitName(""); setSelDetail(""); }, [selLevel]);
    useEffect(() => { setSelSubject(""); setSelUnitName(""); setSelDetail(""); }, [selGrade]);
    useEffect(() => { setSelUnitName(""); setSelDetail(""); }, [selSubject]);
    useEffect(() => { setSelDetail(""); }, [selUnitName]);

    // Reset filter logic
    useEffect(() => { setFilterGrade("all"); setFilterSubject("all"); setFilterUnitName("all"); setFilterDetail("all"); }, [filterLevel]);
    useEffect(() => { setFilterSubject("all"); setFilterUnitName("all"); setFilterDetail("all"); }, [filterGrade]);
    useEffect(() => { setFilterUnitName("all"); setFilterDetail("all"); }, [filterSubject]);
    useEffect(() => { setFilterDetail("all"); }, [filterUnitName]);

    // Derived Lists from Full Curriculum Data
    const levels = SCHOOL_LEVELS;

    const grades = useMemo(() => {
        if (!selLevel) return [];
        return GRADES[selLevel as keyof typeof GRADES] || [];
    }, [selLevel]);

    const subjects = useMemo(() => {
        if (!selLevel || !selGrade) return [];
        return SUBJECTS[selLevel as keyof typeof SUBJECTS]?.[selGrade] || [];
    }, [selLevel, selGrade]);

    const unitList = useMemo(() => {
        if (!selSubject || !selGrade) return [];
        return getUnits(selSubject, selGrade);
    }, [selSubject, selGrade]);

    const details = useMemo(() => {
        if (!selUnitName) return [];
        const unit = unitList.find(u => u.unit === selUnitName);
        return unit?.details || [];
    }, [unitList, selUnitName]);

    // Filter Options (for notes list) - derived from actual notes data
    const filterLevels = useMemo(() => {
        const unique = new Set(notes.map((n: any) => n.schoolLevel).filter(Boolean));
        return Array.from(unique).sort();
    }, [notes]);

    const filterGrades = useMemo(() => {
        let filtered = notes;
        if (filterLevel !== "all") {
            filtered = filtered.filter((n: any) => n.schoolLevel === filterLevel);
        }
        const unique = new Set(filtered.map((n: any) => n.grade).filter(Boolean));
        return Array.from(unique).sort();
    }, [notes, filterLevel]);

    const filterSubjects = useMemo(() => {
        let filtered = notes;
        if (filterLevel !== "all") filtered = filtered.filter((n: any) => n.schoolLevel === filterLevel);
        if (filterGrade !== "all") filtered = filtered.filter((n: any) => n.grade === filterGrade);
        const unique = new Set(filtered.map((n: any) => n.subject).filter(Boolean));
        return Array.from(unique).sort();
    }, [notes, filterLevel, filterGrade]);

    const filterUnitNames = useMemo(() => {
        let filtered = notes;
        if (filterLevel !== "all") filtered = filtered.filter((n: any) => n.schoolLevel === filterLevel);
        if (filterGrade !== "all") filtered = filtered.filter((n: any) => n.grade === filterGrade);
        if (filterSubject !== "all") filtered = filtered.filter((n: any) => n.subject === filterSubject);
        const unique = new Set(filtered.map((n: any) => n.unitName).filter(Boolean));
        return Array.from(unique).sort();
    }, [notes, filterLevel, filterGrade, filterSubject]);

    const filterDetails = useMemo(() => {
        let filtered = notes;
        if (filterLevel !== "all") filtered = filtered.filter((n: any) => n.schoolLevel === filterLevel);
        if (filterGrade !== "all") filtered = filtered.filter((n: any) => n.grade === filterGrade);
        if (filterSubject !== "all") filtered = filtered.filter((n: any) => n.subject === filterSubject);
        if (filterUnitName !== "all") filtered = filtered.filter((n: any) => n.unitName === filterUnitName);
        const unique = new Set(filtered.map((n: any) => n.unitDetail).filter(Boolean));
        return Array.from(unique).sort();
    }, [notes, filterLevel, filterGrade, filterSubject, filterUnitName]);

    // Filtered notes
    const filteredNotes = useMemo(() => {
        return notes.filter((n: any) => {
            const matchesLevel = filterLevel === "all" || n.schoolLevel === filterLevel;
            const matchesGrade = filterGrade === "all" || n.grade === filterGrade;
            const matchesSubject = filterSubject === "all" || n.subject === filterSubject;
            const matchesUnit = filterUnitName === "all" || n.unitName === filterUnitName;
            const matchesDetail = filterDetail === "all" || n.unitDetail === filterDetail;
            return matchesLevel && matchesGrade && matchesSubject && matchesUnit && matchesDetail;
        });
    }, [notes, filterLevel, filterGrade, filterSubject, filterUnitName, filterDetail]);

    const resetFilters = () => {
        setFilterLevel("all");
        setFilterGrade("all");
        setFilterSubject("all");
        setFilterUnitName("all");
        setFilterDetail("all");
    };

    const [formData, setFormData] = useState({
        bookName: "",
        page: "",
        number: "",
        memo: "",
        errorType: "C",
        questionImg: "",
    });

    const handleOpenAdd = () => {
        setModalMode('add');
        setEditingNoteId(null);
        setSelLevel("");
        setFormData({
            bookName: "",
            page: "",
            number: "",
            memo: "",
            errorType: "C",
            questionImg: "",
        });
        setIsModalOpen(true);
    };

    const handleEditClick = (note: any) => {
        setModalMode('edit');
        setEditingNoteId(note.id);

        // Populate curriculum selection
        const schoolLevel = note.unit?.schoolLevel || note.schoolLevel || "";
        const grade = note.unit?.grade || note.grade || "";
        const subject = note.unit?.subject || note.subject || "";
        const unitName = note.unit?.unitName || note.unit?.name || note.unitName || "";
        const unitDetail = note.unitDetail || "";

        setSelLevel(schoolLevel);
        // We need to wait for useEffects to trigger or manually set them if we want immediate sync,
        // but since these are controlled, setting them in sequence or using a timeout is sometimes needed
        // however, the simplest is to set them and let the component re-render.
        setTimeout(() => {
            setSelGrade(grade);
            setTimeout(() => {
                setSelSubject(subject);
                setTimeout(() => {
                    setSelUnitName(unitName);
                    setTimeout(() => {
                        setSelDetail(unitDetail);
                    }, 0);
                }, 0);
            }, 0);
        }, 0);

        // Parse problemName back into fields if possible
        const problemName = note.problemName || "";
        const match = problemName.match(/(.*)\s+(\d+)p\s+(\d+)번/);

        if (match) {
            setFormData({
                bookName: match[1],
                page: match[2],
                number: match[3],
                memo: note.memo || "",
                errorType: note.errorType || "C",
                questionImg: note.questionImg || "",
            });
        } else {
            setFormData({
                bookName: problemName,
                page: "",
                number: "",
                memo: note.memo || "",
                errorType: note.errorType || "C",
                questionImg: note.questionImg || "",
            });
        }

        setIsModalOpen(true);
    };

    const handleSubmit = async () => {
        const isMiddle = selLevel && isMiddleSchool(selLevel);

        if (!selLevel || !selGrade || !selSubject || !selUnitName || !formData.bookName || (!isMiddle && !selDetail)) {
            alert(isMiddle ? "모든 항목을 입력해주세요." : "단원, 세부내용, 교재명을 모두 입력해주세요.");
            return;
        }

        setIsLoading(true);

        const combinedName = `${formData.bookName} ${formData.page ? `${formData.page}p ` : ''}${formData.number ? `${formData.number}번` : ''}`.trim();

        const payload = {
            problemName: combinedName,
            memo: formData.memo,
            errorType: formData.errorType,
            questionImg: formData.questionImg,
            unitDetail: isMiddle ? "" : selDetail,
            schoolLevel: selLevel,
            grade: selGrade,
            subject: selSubject,
            unitName: selUnitName
        };

        let result;
        if (modalMode === 'add') {
            // Find matching unit from student's units
            let matchingUnit = units.find(u =>
                u.schoolLevel === selLevel &&
                u.grade === selGrade &&
                u.subject === selSubject &&
                (u.unitName || u.name) === selUnitName
            );
            const unitIdToUse = matchingUnit ? matchingUnit.id : 0;

            result = await createIncorrectNote(studentId, {
                ...payload,
                unitId: unitIdToUse,
            });
        } else {
            result = await updateIncorrectNote(studentId, editingNoteId!, payload);
        }

        setIsLoading(false);

        if (result.success) {
            alert(modalMode === 'add' ? "오답노트가 등록되었습니다." : "오답노트가 수정되었습니다.");
            setIsModalOpen(false);
            router.refresh();
        } else {
            alert(result.message || "오답노트 저장 실패");
        }
    };

    const handleDelete = async (noteId: string) => {
        if (!confirm("정말 이 오답노트를 삭제하시겠습니까?")) return;

        setIsLoading(true);
        const result = await deleteIncorrectNote(studentId, noteId);
        setIsLoading(false);

        if (result.success) {
            router.refresh();
        } else {
            alert(result.message || "삭제 실패");
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
                <h2 className="text-xl font-bold tracking-tight">오답 노트 ({filteredNotes.length})</h2>
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleOpenAdd}>
                        <Plus className="mr-2 h-4 w-4" />
                        오답노트 작성
                    </Button>
                    <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{modalMode === 'add' ? '오답노트 작성' : '오답노트 수정'}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-6 py-4">
                            {/* 5-Level Selection Grid */}
                            <div className="grid grid-cols-2 gap-x-8 gap-y-4 bg-gray-50/50 p-4 rounded-lg border border-gray-100">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-gray-500 uppercase">학제</Label>
                                    <Select value={selLevel} onValueChange={setSelLevel}>
                                        <SelectTrigger className="bg-white"><SelectValue placeholder="학제 선택" /></SelectTrigger>
                                        <SelectContent>
                                            {levels.map((l: any) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-gray-500 uppercase">학년</Label>
                                    <Select value={selGrade} onValueChange={setSelGrade} disabled={!selLevel}>
                                        <SelectTrigger className="bg-white"><SelectValue placeholder="학년 선택" /></SelectTrigger>
                                        <SelectContent>
                                            {grades.map((g: any) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-gray-500 uppercase">과목/영역</Label>
                                    <Select value={selSubject} onValueChange={setSelSubject} disabled={!selGrade}>
                                        <SelectTrigger className="bg-white"><SelectValue placeholder="과목 선택" /></SelectTrigger>
                                        <SelectContent>
                                            {subjects.map((s: any) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-gray-500 uppercase">단원</Label>
                                    <Select value={selUnitName} onValueChange={setSelUnitName} disabled={!selSubject}>
                                        <SelectTrigger className="bg-white"><SelectValue placeholder="단원 선택" /></SelectTrigger>
                                        <SelectContent>
                                            {unitList.map((u: any) => (
                                                <SelectItem key={u.unit} value={u.unit}>{u.unit}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* 세부내용 - 고등만 표시 */}
                                {!isMiddleSchool(selLevel || "") && (
                                    <div className="col-span-2 space-y-2">
                                        <Label className="text-xs font-bold text-gray-500 uppercase">세부내용</Label>
                                        <Select value={selDetail} onValueChange={setSelDetail} disabled={!selUnitName || details.length === 0}>
                                            <SelectTrigger className="bg-white">
                                                <SelectValue placeholder={details.length > 0 ? "세부내용 선택" : "세부내용 없음"} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {details.map((d: any) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div className="grid gap-2">
                                        <Label className="font-semibold">문제 정보</Label>
                                        <div className="grid grid-cols-4 gap-3">
                                            <div className="col-span-2">
                                                <Input
                                                    placeholder="교재명 (예: 쎈)"
                                                    value={formData.bookName}
                                                    onChange={(e) => setFormData({ ...formData, bookName: e.target.value })}
                                                />
                                            </div>
                                            <div className="relative">
                                                <Input
                                                    placeholder="페이지"
                                                    value={formData.page}
                                                    onChange={(e) => setFormData({ ...formData, page: e.target.value })}
                                                    className="pr-6"
                                                />
                                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-500">p</span>
                                            </div>
                                            <div className="relative">
                                                <Input
                                                    placeholder="번호"
                                                    value={formData.number}
                                                    onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                                                    className="pr-6"
                                                />
                                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-500">번</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="font-semibold">오답 유형</Label>
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
                                        <Label className="font-semibold">메모 / 풀이</Label>
                                        <Textarea
                                            placeholder="틀린 이유나 올바른 풀이 과정을 기록하세요."
                                            className="h-32"
                                            value={formData.memo}
                                            onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <Label className="font-semibold">이미지 첨부 (선택)</Label>
                                    <div
                                        className="h-[250px] border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center bg-gray-50/50 hover:bg-gray-50 hover:border-blue-300 transition-all cursor-pointer relative overflow-hidden"
                                        onClick={() => document.getElementById('file-upload')?.click()}
                                    >
                                        {formData.questionImg ? (
                                            <img
                                                src={formData.questionImg}
                                                alt="Preview"
                                                className="h-full w-full object-contain p-2"
                                            />
                                        ) : (
                                            <>
                                                <FileImage className="h-10 w-10 text-gray-300 mb-2" />
                                                <span className="text-sm text-gray-500">클릭하여 이미지 업로드</span>
                                            </>
                                        )}
                                        <Input
                                            id="file-upload"
                                            type="file"
                                            className="hidden"
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
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setFormData({ ...formData, questionImg: "" });
                                                }}
                                                className="absolute top-2 right-2 bg-gray-900/50 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors"
                                                type="button"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-400 text-center">이미지를 드래그하거나 클릭하여 파일을 선택하세요.</p>
                                </div>
                            </div>
                        </div>
                        <DialogFooter className="pt-4 border-t">
                            <Button variant="outline" onClick={() => setIsModalOpen(false)} className="w-24">취소</Button>
                            <Button onClick={handleSubmit} disabled={isLoading} className="w-32 bg-blue-600 hover:bg-blue-700">
                                {modalMode === 'add' ? '오답노트 등록' : '수정 완료'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Filter Section */}
            <div className="bg-white p-4 rounded-lg border">
                <div className="flex flex-wrap items-center gap-3">
                    <Select value={filterLevel} onValueChange={setFilterLevel}>
                        <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="학제" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">전체 학제</SelectItem>
                            {filterLevels.map((level: string) => (
                                <SelectItem key={level} value={level}>{level}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={filterGrade} onValueChange={setFilterGrade}>
                        <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="학년" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">전체 학년</SelectItem>
                            {filterGrades.map((grade: any) => (
                                <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={filterSubject} onValueChange={setFilterSubject}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="영역/과목" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">전체 영역/과목</SelectItem>
                            {filterSubjects.map((s: any) => (
                                <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={filterUnitName} onValueChange={setFilterUnitName}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="단원" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">전체 단원</SelectItem>
                            {filterUnitNames.map((u: any) => (
                                <SelectItem key={u} value={u}>{u}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* 세부내용 필터 - 고등만 표시 */}
                    {filterLevel !== "all" && !isMiddleSchool(filterLevel) && (
                        <Select value={filterDetail} onValueChange={setFilterDetail}>
                            <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="세부내용" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">전체 세부내용</SelectItem>
                                {filterDetails.map((d: any) => (
                                    <SelectItem key={d} value={d}>{d}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}

                    {(filterLevel !== "all" || filterGrade !== "all" || filterSubject !== "all" || filterUnitName !== "all" || filterDetail !== "all") && (
                        <Button variant="ghost" size="icon" onClick={resetFilters} title="필터 초기화">
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>

            {filteredNotes.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                    <AlertCircle className="mx-auto h-10 w-10 text-gray-400 mb-4" />
                    <p className="text-gray-500 font-medium">검색 결과가 없습니다.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {filteredNotes.map((note) => (
                        <Card key={note.id} className="overflow-hidden">
                            <CardHeader className="bg-gray-50/50 pb-0">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <Badge variant="outline" className="bg-white">
                                                {note.unit
                                                    ? `[${note.unit.schoolLevel || ''}] ${note.unit.grade} ${note.unit.subject}`
                                                    : (note.schoolLevel ? `[${note.schoolLevel}] ${note.grade} ${note.subject}` : "단원 미지정")}
                                            </Badge>
                                            <Badge variant="outline" className="bg-white font-medium">
                                                {note.unit?.unitName || note.unit?.name || note.unitName || "단원 미지정"}
                                            </Badge>
                                            {note.unitDetail && (
                                                <Badge variant="secondary" className="bg-gray-200 text-gray-700">
                                                    {note.unitDetail}
                                                </Badge>
                                            )}
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
                                        <CardTitle className="text-base font-bold text-gray-900 mt-2">
                                            {note.problemName || "문제 이름 없음"}
                                        </CardTitle>
                                    </div>
                                    <div className="flex items-start gap-2 ml-2">
                                        <div className="text-xs text-gray-400 whitespace-nowrap mt-2">
                                            {new Date(note.createdAt).toLocaleDateString()}
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                                            onClick={() => handleEditClick(note)}
                                            disabled={isLoading}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50"
                                            onClick={() => handleDelete(note.id)}
                                            disabled={isLoading}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4">
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
                                            <div
                                                className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200 group cursor-zoom-in"
                                                onClick={() => setSelectedZoomImg(note.questionImg)}
                                            >
                                                <div className="flex items-center justify-center h-full text-gray-400">
                                                    <img
                                                        src={note.questionImg}
                                                        alt="문제 이미지"
                                                        className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                                                        onError={(e) => (e.currentTarget.style.display = 'none')}
                                                    />
                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button variant="secondary" size="sm" className="bg-white/90 hover:bg-white text-gray-900 border-none shadow-lg">
                                                            클릭하여 확대보기
                                                        </Button>
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

            {/* Image Zoom Modal */}
            <Dialog open={!!selectedZoomImg} onOpenChange={(open) => !open && setSelectedZoomImg(null)}>
                <DialogContent className="max-w-[95vw] w-fit p-1 bg-black/90 border-none">
                    {selectedZoomImg && (
                        <div className="relative flex items-center justify-center min-h-[50vh]">
                            <img
                                src={selectedZoomImg}
                                alt="문제 확대 이미지"
                                className="max-h-[85vh] max-w-full object-contain"
                            />
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute -top-1 -right-1 text-white hover:bg-white/20 rounded-full"
                                onClick={() => setSelectedZoomImg(null)}
                            >
                                <X className="h-6 w-6" />
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
