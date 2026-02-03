"use client";

import { useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UnitCard } from "@/components/features/dashboard/UnitCard";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface StudentLearningClientProps {
    units: any[];
}

export default function StudentLearningClient({ units }: StudentLearningClientProps) {
    const [selectedGrade, setSelectedGrade] = useState<string>("all");
    const [selectedSubject, setSelectedSubject] = useState<string>("all");

    // Extract unique grades and subjects
    const grades = useMemo(() => {
        const unique = new Set(units.map(u => u.grade).filter(Boolean));
        return Array.from(unique).sort();
    }, [units]);

    const subjects = useMemo(() => {
        const unique = new Set(units.map(u => u.subject).filter(Boolean));
        return Array.from(unique).sort();
    }, [units]);

    // Filter units
    const filteredUnits = useMemo(() => {
        return units.filter(u => {
            const matchesGrade = selectedGrade === "all" || u.grade === selectedGrade;
            const matchesSubject = selectedSubject === "all" || u.subject === selectedSubject;
            return matchesGrade && matchesSubject;
        });
    }, [units, selectedGrade, selectedSubject]);

    // Group units by completion status
    const completedUnits = filteredUnits.filter((u: any) => u.completionStatus === 'completed');
    const inProgressUnits = filteredUnits.filter((u: any) => u.completionStatus === 'in-progress');
    const incompleteUnits = filteredUnits.filter((u: any) => !u.completionStatus || u.completionStatus === 'incomplete');

    const resetFilters = () => {
        setSelectedGrade("all");
        setSelectedSubject("all");
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
                            onDifficultyChange={() => { }}
                            onDelete={() => { }}
                            onErrorChange={() => { }}
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
                <h1 className="text-2xl font-bold">나의 학습 현황</h1>

                <div className="flex flex-wrap items-center gap-2">
                    <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                        <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="학년" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">전체 학년</SelectItem>
                            {grades.map(g => (
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
                            {subjects.map(s => (
                                <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {(selectedGrade !== "all" || selectedSubject !== "all") && (
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
