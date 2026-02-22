"use client";

import { useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UnitCard } from "@/components/features/dashboard/UnitCard-v2";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X, BookOpen } from "lucide-react";
import { isMiddleSchool } from "@/lib/curriculum-data";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { updateUnitError } from "@/actions/admin-actions";
import { useReadOnly } from "@/contexts/ReadOnlyContext";

interface StudentLearningClientProps {
    units: any[];
    studentDocId: string;
}

export default function StudentLearningClient({ units, studentDocId }: StudentLearningClientProps) {
    const router = useRouter();
    const readOnly = useReadOnly();
    const [isPending, startTransition] = useTransition();
    const [selectedLevel, setSelectedLevel] = useState<string>("all");
    const [selectedGrade, setSelectedGrade] = useState<string>("all");
    const [selectedSubject, setSelectedSubject] = useState<string>("all");
    const [selectedUnitName, setSelectedUnitName] = useState<string>("all");
    const [selectedDetail, setSelectedDetail] = useState<string>("all");

    // Extract unique levels, grades and subjects
    const levels = useMemo(() => {
        const unique = new Set(units.map(u => u.schoolLevel).filter(Boolean));
        return Array.from(unique).sort();
    }, [units]);

    const grades = useMemo(() => {
        let filtered = units;
        if (selectedLevel !== "all") {
            filtered = filtered.filter(u => u.schoolLevel === selectedLevel);
        }
        const unique = new Set(filtered.map(u => u.grade).filter(Boolean));
        return Array.from(unique).sort();
    }, [units, selectedLevel]);

    const subjects = useMemo(() => {
        let filtered = units;
        if (selectedLevel !== "all") {
            filtered = filtered.filter(u => u.schoolLevel === selectedLevel);
        }
        if (selectedGrade !== "all") {
            filtered = filtered.filter(u => u.grade === selectedGrade);
        }
        const unique = new Set(filtered.map(u => u.subject).filter(Boolean));
        return Array.from(unique).sort();
    }, [units, selectedLevel, selectedGrade]);

    const unitNames = useMemo(() => {
        let filtered = units;
        if (selectedLevel !== "all") filtered = filtered.filter(u => u.schoolLevel === selectedLevel);
        if (selectedGrade !== "all") filtered = filtered.filter(u => u.grade === selectedGrade);
        if (selectedSubject !== "all") filtered = filtered.filter(u => u.subject === selectedSubject);
        const unique = new Set(filtered.map(u => u.unitName || u.name).filter(Boolean));
        return Array.from(unique).sort();
    }, [units, selectedLevel, selectedGrade, selectedSubject]);

    const details = useMemo(() => {
        let filtered = units;
        if (selectedLevel !== "all") filtered = filtered.filter(u => u.schoolLevel === selectedLevel);
        if (selectedGrade !== "all") filtered = filtered.filter(u => u.grade === selectedGrade);
        if (selectedSubject !== "all") filtered = filtered.filter(u => u.subject === selectedSubject);
        if (selectedUnitName !== "all") filtered = filtered.filter(u => (u.unitName || u.name) === selectedUnitName);
        const allDetails = filtered.flatMap(u => u.unitDetails || []);
        return Array.from(new Set(allDetails)).sort();
    }, [units, selectedLevel, selectedGrade, selectedSubject, selectedUnitName]);

    // Filter units
    const filteredUnits = useMemo(() => {
        return units.filter(u => {
            const matchesLevel = selectedLevel === "all" || u.schoolLevel === selectedLevel;
            const matchesGrade = selectedGrade === "all" || u.grade === selectedGrade;
            const matchesSubject = selectedSubject === "all" || u.subject === selectedSubject;
            const matchesUnit = selectedUnitName === "all" || (u.unitName || u.name) === selectedUnitName;
            const matchesDetail = selectedDetail === "all" || u.unitDetails?.includes(selectedDetail);
            return matchesLevel && matchesGrade && matchesSubject && matchesUnit && matchesDetail;
        });
    }, [units, selectedLevel, selectedGrade, selectedSubject, selectedUnitName, selectedDetail]);

    // Group units by completion status
    const completedUnits = filteredUnits.filter((u: any) => u.completionStatus === 'completed');
    const inProgressUnits = filteredUnits.filter((u: any) => u.completionStatus === 'in-progress');
    const incompleteUnits = filteredUnits.filter((u: any) => !u.completionStatus || u.completionStatus === 'incomplete');

    const resetFilters = () => {
        setSelectedLevel("all");
        setSelectedGrade("all");
        setSelectedSubject("all");
        setSelectedUnitName("all");
        setSelectedDetail("all");
    };

    const UnitGrid = ({ units, emptyMessage }: { units: any[], emptyMessage: string }) => (
        <>
            {units.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {units.map((unit: any) => (
                        // @ts-ignore
                        <UnitCard
                            key={unit.id}
                            unit={unit}
                            showDifficultySelector={false}
                            showStatus={false}
                            showDeleteButton={false}
                            showErrorChangeButtons={!readOnly}
                            onDifficultyChange={() => { }}
                            onDelete={() => { }}
                            onErrorChange={(unitId, errorType, delta) => {
                                if (readOnly) return;
                                startTransition(async () => {
                                    await updateUnitError(unitId, studentDocId, errorType, delta);
                                    router.refresh();
                                });
                            }}
                        />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                    <p className="text-gray-500 font-medium">{emptyMessage}</p>
                </div>
            )}
        </>
    );

    return (
        <div className="space-y-6 pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-[#F0F3FF]">
                        <BookOpen className="w-6 h-6 text-[#5D00E2]" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-[#2F3438]">나의 학습 현황</h1>
                        <p className="text-sm text-[#6C727A] mt-0.5">등록된 단원별 학습 현황과 오답 수를 확인하세요.</p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                        <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="학제" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">전체 학제</SelectItem>
                            {levels.map((l: any) => (
                                <SelectItem key={l} value={l}>{l}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                        <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="학년" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">전체 학년</SelectItem>
                            {grades.map((g: any) => (
                                <SelectItem key={g} value={g}>{g}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                        <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="과목" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">전체 과목</SelectItem>
                            {subjects.map((s: any) => (
                                <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={selectedUnitName} onValueChange={setSelectedUnitName}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="단원" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">전체 단원</SelectItem>
                            {unitNames.map((u: any) => (
                                <SelectItem key={u} value={u}>{u}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* 세부내용 필터 - 고등만 표시 */}
                    {selectedLevel !== "all" && !isMiddleSchool(selectedLevel) && (
                        <Select value={selectedDetail} onValueChange={setSelectedDetail}>
                            <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="세부내용" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">전체 세부내용</SelectItem>
                                {details.map((d: any) => (
                                    <SelectItem key={d} value={d}>{d}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}

                    {(selectedLevel !== "all" || selectedGrade !== "all" || selectedSubject !== "all" || selectedUnitName !== "all" || selectedDetail !== "all") && (
                        <Button variant="ghost" size="icon" onClick={resetFilters} title="필터 초기화">
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>

            <Tabs defaultValue="in-progress" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-8">
                    <TabsTrigger value="completed">학습 완료됨 ({completedUnits.length})</TabsTrigger>
                    <TabsTrigger value="in-progress">진행중 ({inProgressUnits.length})</TabsTrigger>
                    <TabsTrigger value="incomplete">미진행 ({incompleteUnits.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="completed" className="space-y-4">
                    <UnitGrid units={completedUnits} emptyMessage="조건에 맞는 완료된 학습이 없습니다." />
                </TabsContent>

                <TabsContent value="in-progress" className="space-y-4">
                    <UnitGrid units={inProgressUnits} emptyMessage="조건에 맞는 진행 중인 학습이 없습니다." />
                </TabsContent>

                <TabsContent value="incomplete" className="space-y-4">
                    <UnitGrid units={incompleteUnits} emptyMessage="조건에 맞는 미진행된 학습이 없습니다." />
                </TabsContent>
            </Tabs>
        </div>
    );
}
