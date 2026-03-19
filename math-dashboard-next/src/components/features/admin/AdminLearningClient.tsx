"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, Check, ChevronsUpDown, X, BookOpen } from "lucide-react";
import { Unit } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UnitCard } from "@/components/features/dashboard/UnitCard-v2";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { createUnit, deleteUnit, updateUnit, updateUnitError } from "@/actions/admin-actions";
import { useRouter } from "next/navigation";
import { SCHOOL_LEVELS, GRADES, SUBJECTS, getUnits, SchoolLevel, isMiddleSchool } from "@/lib/curriculum-data";
import { PageHeader } from "@/components/shared/PageHeader";

interface AdminLearningClientProps {
    initialUnits: Unit[];
    studentDocId: string;
}

export default function AdminLearningClient({ initialUnits, studentDocId }: AdminLearningClientProps) {
    const router = useRouter();
    const [units, setUnits] = useState(initialUnits);
    useEffect(() => { setUnits(initialUnits); }, [initialUnits]);

    // 5-Step Cascading Selection State for Adding Units
    const [selectedLevel, setSelectedLevel] = useState<SchoolLevel | "">("");
    const [selectedGrade, setSelectedGrade] = useState<string>("");
    const [selectedSubject, setSelectedSubject] = useState<string>("");
    const [selectedUnit, setSelectedUnit] = useState<string>("");
    const [selectedDetail, setSelectedDetail] = useState<string>(""); // Changed from array to string for unified Select logic

    // 5-Step Filter State for Searching Units
    const [filterLevel, setFilterLevel] = useState<string>("all");
    const [filterGrade, setFilterGrade] = useState<string>("all");
    const [filterSubject, setFilterSubject] = useState<string>("all");
    const [filterUnitName, setFilterUnitName] = useState<string>("all");
    const [filterDetail, setFilterDetail] = useState<string>("all");

    const [activeTab, setActiveTab] = useState("all");
    const [isAddUnitOpen, setIsAddUnitOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

    // Derived filter options
    const filterLevels = useMemo(() => Array.from(new Set(units.map(u => u.schoolLevel))), [units]);
    const filterGrades = useMemo(() => {
        if (filterLevel === "all") return Array.from(new Set(units.map(u => u.grade)));
        return Array.from(new Set(units.filter(u => u.schoolLevel === filterLevel).map(u => u.grade)));
    }, [units, filterLevel]);
    const filterSubjects = useMemo(() => {
        let filtered = units;
        if (filterLevel !== "all") filtered = filtered.filter(u => u.schoolLevel === filterLevel);
        if (filterGrade !== "all") filtered = filtered.filter(u => u.grade === filterGrade);
        return Array.from(new Set(filtered.map(u => u.subject)));
    }, [units, filterLevel, filterGrade]);
    const filterUnitNames = useMemo(() => {
        let filtered = units;
        if (filterLevel !== "all") filtered = filtered.filter(u => u.schoolLevel === filterLevel);
        if (filterGrade !== "all") filtered = filtered.filter(u => u.grade === filterGrade);
        if (filterSubject !== "all") filtered = filtered.filter(u => u.subject === filterSubject);
        return Array.from(new Set(filtered.map(u => u.unitName || u.name)));
    }, [units, filterLevel, filterGrade, filterSubject]);
    const filterDetails = useMemo(() => {
        let filtered = units;
        if (filterLevel !== "all") filtered = filtered.filter(u => u.schoolLevel === filterLevel);
        if (filterGrade !== "all") filtered = filtered.filter(u => u.grade === filterGrade);
        if (filterSubject !== "all") filtered = filtered.filter(u => u.subject === filterSubject);
        if (filterUnitName !== "all") filtered = filtered.filter(u => (u.unitName || u.name) === filterUnitName);
        const allDetails = filtered.flatMap(u => u.unitDetails || []);
        return Array.from(new Set(allDetails));
    }, [units, filterLevel, filterGrade, filterSubject, filterUnitName]);

    // Cascading Resets
    useEffect(() => { setSelectedGrade(""); setSelectedSubject(""); setSelectedUnit(""); setSelectedDetail(""); }, [selectedLevel]);
    useEffect(() => { setSelectedSubject(""); setSelectedUnit(""); setSelectedDetail(""); }, [selectedGrade]);
    useEffect(() => { setSelectedUnit(""); setSelectedDetail(""); }, [selectedSubject]);
    useEffect(() => { setSelectedDetail(""); }, [selectedUnit]);

    // Derived Selection Options
    const availableGrades = selectedLevel ? GRADES[selectedLevel] : [];
    const availableSubjects = (selectedLevel && selectedGrade) ? (SUBJECTS[selectedLevel][selectedGrade] || []) : [];
    const availableUnits = (selectedSubject && selectedGrade) ? getUnits(selectedSubject, selectedGrade) : [];

    // Find currently selected unit object to get its details
    const currentUnitObj = availableUnits.find(u => u.unit === selectedUnit);
    const availableDetails = currentUnitObj ? currentUnitObj.details : [];

    const handleAddUnit = async () => {
        const isMiddle = selectedLevel && isMiddleSchool(selectedLevel);

        if (!selectedLevel || !selectedGrade || !selectedSubject || !selectedUnit || (!isMiddle && !selectedDetail)) {
            alert(isMiddle ? "모든 항목을 선택해야 합니다." : "모든 항목을 선택해야 합니다. (세부내용 포함)");
            return;
        }

        setIsAddUnitOpen(false);
        setSelectedDetail("");
        setSelectedUnit("");

        createUnit(studentDocId, {
            schoolLevel: selectedLevel,
            grade: selectedGrade,
            subject: selectedSubject,
            unitName: selectedUnit,
            unitDetails: isMiddle ? [] : [selectedDetail],
            name: isMiddle ? selectedUnit : selectedDetail,
            status: "MID",
            selectedDifficulty: "중"
        }).then((result) => {
            if (result.success) {
                router.refresh();
            } else {
                alert(`단원 추가 실패: ${result.message || '알 수 없는 오류'}`);
                console.error('Unit creation failed:', result.message);
            }
        });
    };



    const handleDifficultyChange = async (unitId: number, difficulty: string) => {
        const unit = units.find(u => u.id === unitId);
        if (!unit) return;
        setUnits(prev => prev.map(u => u.id === unitId ? { ...u, selectedDifficulty: difficulty } : u));
        updateUnit(unitId, studentDocId, { ...unit, selectedDifficulty: difficulty }).then(() => {
            router.refresh();
        });
    };
    const handleDelete = (unitId: number) => {
        setDeleteTarget(unitId);
    };
    const handleDeleteConfirm = async () => {
        if (deleteTarget === null) return;
        const unitId = deleteTarget;
        setDeleteTarget(null);
        setUnits(prev => prev.filter(u => u.id !== unitId));
        deleteUnit(unitId, studentDocId).then((result) => {
            if (result.success) router.refresh();
        });
    };
    const handleErrorChange = async (unitId: number, errorType: 'C' | 'M' | 'R' | 'S', delta: number) => {
        const errorField = `error${errorType}` as keyof Unit;
        setUnits(prev => prev.map(u => {
            if (u.id !== unitId) return u;
            const currentVal = (u[errorField] as number) || 0;
            return { ...u, [errorField]: Math.max(0, currentVal + delta) };
        }));
        updateUnitError(unitId, studentDocId, errorType, delta).then((result) => {
            if (result.success) router.refresh();
            else alert("수정 실패");
        });
    };
    const handleCompletionStatusChange = async (unitId: number, status: 'incomplete' | 'in-progress' | 'completed') => {
        setUnits(prev => prev.map(u => u.id === unitId ? { ...u, completionStatus: status } : u));
        updateUnit(unitId, studentDocId, { completionStatus: status }).then((result) => {
            if (result.success) router.refresh();
            else alert("수정 실패");
        });
    };
    const handleStatusChange = async (unitId: number, status: 'HIGH' | 'MID' | 'LOW') => {
        const unit = units.find(u => u.id === unitId);
        if (!unit) return;
        setUnits(prev => prev.map(u => u.id === unitId ? { ...u, status: status } : u));
        updateUnit(unitId, studentDocId, { ...unit, status: status }).then(() => {
            router.refresh();
        });
    };

    const filteredUnits = units.filter(unit => {
        // Tab filter
        if (activeTab === "in-progress" && unit.completionStatus !== "in-progress") return false;
        if (activeTab === "completed" && unit.completionStatus !== "completed") return false;
        if (activeTab === "incomplete" && unit.completionStatus !== "incomplete" && unit.completionStatus) return false;

        // 5-level hierarchy filters
        if (filterLevel !== "all" && unit.schoolLevel !== filterLevel) return false;
        if (filterGrade !== "all" && unit.grade !== filterGrade) return false;
        if (filterSubject !== "all" && unit.subject !== filterSubject) return false;
        if (filterUnitName !== "all" && (unit.unitName || unit.name) !== filterUnitName) return false;
        if (filterDetail !== "all" && !unit.unitDetails?.includes(filterDetail)) return false;

        return true;
    });

    const resetFilters = () => {
        setFilterLevel("all");
        setFilterGrade("all");
        setFilterSubject("all");
        setFilterUnitName("all");
        setFilterDetail("all");
    };

    return (
        <div className="space-y-6 text-sm leading-relaxed">
            <PageHeader
                title="나의 학습 (관리자)"
                description="학생의 전체 단원과 난이도, 학습 완료 상태를 관리합니다."
                icon={
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-[#F0F3FF]">
                        <BookOpen className="w-6 h-6 text-[#5D00E2]" />
                    </div>
                }
                actions={
                    <Dialog open={isAddUnitOpen} onOpenChange={setIsAddUnitOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                단원 추가 (관리자)
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader><DialogTitle>새 단원 추가</DialogTitle></DialogHeader>
                        <div className="grid grid-cols-2 gap-x-8 gap-y-6 py-6">
                            {/* 1. School Level */}
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold">학제</Label>
                                <div className="flex gap-2">
                                    {SCHOOL_LEVELS.map(level => (
                                        <Button
                                            key={level}
                                            type="button"
                                            variant={selectedLevel === level ? "default" : "outline"}
                                            onClick={() => setSelectedLevel(level)}
                                            className="grow transition-all"
                                        >
                                            {level}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            {/* 2. Grade */}
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold">학년</Label>
                                <Select value={selectedGrade} onValueChange={setSelectedGrade} disabled={!selectedLevel}>
                                    <SelectTrigger className="w-full"><SelectValue placeholder="학년 선택" /></SelectTrigger>
                                    <SelectContent>
                                        {availableGrades.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* 3. Subject */}
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold">과목/영역</Label>
                                <Select value={selectedSubject} onValueChange={setSelectedSubject} disabled={!selectedGrade}>
                                    <SelectTrigger className="w-full"><SelectValue placeholder="과목 선택" /></SelectTrigger>
                                    <SelectContent>
                                        {availableSubjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* 4. Unit */}
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold">단원</Label>
                                <Select value={selectedUnit} onValueChange={setSelectedUnit} disabled={!selectedSubject}>
                                    <SelectTrigger className="w-full"><SelectValue placeholder={availableUnits.length > 0 ? "단원 선택" : "선택 가능한 단원 없음"} /></SelectTrigger>
                                    <SelectContent>
                                        {availableUnits.map(u => <SelectItem key={u.unit} value={u.unit}>{u.unit}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* 5. Details - 고등만 표시 */}
                            {!isMiddleSchool(selectedLevel || "") && (
                                <div className="space-y-2 col-span-2">
                                    <Label className="text-sm font-semibold">세부내용</Label>
                                    <Select value={selectedDetail} onValueChange={setSelectedDetail} disabled={!selectedUnit || availableDetails.length === 0}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder={availableDetails.length > 0 ? "세부내용 선택" : "세부내용 없음"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableDetails.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>
                            <DialogFooter className="pt-4 border-t">
                                <Button
                                    className="w-full sm:w-32"
                                    onClick={handleAddUnit}
                                    disabled={
                                        !selectedUnit ||
                                        (!isMiddleSchool(selectedLevel || "") && !selectedDetail)
                                    }
                                >
                                    추가하기
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                }
            />

            {/* 5-Level Search Filters */}
            <div className="bg-white p-4 rounded-lg border">
                <div className="flex flex-wrap items-center gap-3">
                    <Select value={filterLevel} onValueChange={setFilterLevel}>
                        <SelectTrigger className="w-[120px] h-9">
                            <SelectValue placeholder="학제" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">전체 학제</SelectItem>
                            {filterLevels.map(l => (
                                <SelectItem key={l} value={l}>{l}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={filterGrade} onValueChange={setFilterGrade}>
                        <SelectTrigger className="w-[120px] h-9">
                            <SelectValue placeholder="학년" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">전체 학년</SelectItem>
                            {filterGrades.map(g => (
                                <SelectItem key={g} value={g}>{g}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={filterSubject} onValueChange={setFilterSubject}>
                        <SelectTrigger className="w-[140px] h-9">
                            <SelectValue placeholder="영역/과목" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">전체 영역/과목</SelectItem>
                            {filterSubjects.map(s => (
                                <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={filterUnitName} onValueChange={setFilterUnitName}>
                        <SelectTrigger className="w-[140px] h-9">
                            <SelectValue placeholder="단원" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">전체 단원</SelectItem>
                            {filterUnitNames.map(u => (
                                <SelectItem key={u} value={u}>{u}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* 세부내용 필터 - 고등만 표시 */}
                    {filterLevel !== "all" && !isMiddleSchool(filterLevel) && (
                        <Select value={filterDetail} onValueChange={setFilterDetail}>
                            <SelectTrigger className="w-[140px] h-9">
                                <SelectValue placeholder="세부내용" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">전체 세부내용</SelectItem>
                                {filterDetails.map(d => (
                                    <SelectItem key={d} value={d}>{d}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}

                    {(filterLevel !== "all" || filterGrade !== "all" || filterSubject !== "all" || filterUnitName !== "all" || filterDetail !== "all") && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={resetFilters}
                            title="필터 초기화"
                            className="h-9 w-9"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>

            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="all">전체 ({units.length})</TabsTrigger>
                    <TabsTrigger value="incomplete">미완료 ({units.filter(u => u.completionStatus === 'incomplete' || !u.completionStatus).length})</TabsTrigger>
                    <TabsTrigger value="in-progress">진행 중 ({units.filter(u => u.completionStatus === 'in-progress').length})</TabsTrigger>
                    <TabsTrigger value="completed">완료 ({units.filter(u => u.completionStatus === 'completed').length})</TabsTrigger>
                </TabsList>
                <TabsContent value={activeTab} className="mt-6">
                    {filteredUnits.length === 0 ? (
                        <div className="text-center py-20 bg-gray-50 rounded-lg border border-dashed">
                            <p className="text-gray-500">등록된 단원이 없습니다.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredUnits.map((unit) => (
                                <UnitCard
                                    key={unit.id} unit={unit}
                                    onDifficultyChange={handleDifficultyChange}
                                    onDelete={handleDelete}
                                    onErrorChange={handleErrorChange}
                                    onCompletionStatusChange={handleCompletionStatusChange}
                                    onStatusChange={handleStatusChange}
                                    isAdmin={true}
                                />
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>단원 삭제</AlertDialogTitle>
                        <AlertDialogDescription>정말 이 단원을 삭제하시겠습니까? 삭제된 단원은 복구할 수 없습니다.</AlertDialogDescription>
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
