"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Unit } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UnitCard } from "@/components/features/dashboard/UnitCard-v2";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    addUnit,
    updateUnitDifficulty,
    updateUnitName,
    updateUnitDetails,
    deleteUnit, // Keep import but don't show button
    updateUnitError,
    updateCompletionStatus
} from "@/actions/unit-actions";

interface MyLearningClientProps {
    initialUnits: Unit[];
    studentId: number;
}

export default function MyLearningClient({ initialUnits, studentId }: MyLearningClientProps) {
    const [units, setUnits] = useState<Unit[]>(initialUnits);
    const [activeTab, setActiveTab] = useState("all");
    const [isAddUnitOpen, setIsAddUnitOpen] = useState(false);

    // Add Unit State
    const [newUnitName, setNewUnitName] = useState("");
    const [newUnitGrade, setNewUnitGrade] = useState("고1");

    // Filter State
    const [selectedGrade, setSelectedGrade] = useState("all");

    useEffect(() => {
        setUnits(initialUnits);
    }, [initialUnits]);

    // Handlers
    const handleDifficultyChange = async (unitId: number, difficulty: string) => {
        setUnits(prev => prev.map(u => u.id === unitId ? { ...u, selectedDifficulty: difficulty } : u));
        await updateUnitDifficulty(unitId, difficulty);
    };

    const handleUpdateDetails = async (unitId: number, name: string, grade: string) => {
        setUnits(prev => prev.map(u => u.id === unitId ? { ...u, name, grade } : u));
        await updateUnitDetails(unitId, name, grade);
    };

    const handleDelete = async (unitId: number) => {
        // Disabled for student UI as requested
    };

    const handleErrorChange = async (unitId: number, errorType: 'C' | 'M' | 'R' | 'S', delta: number) => {
        setUnits(prev => prev.map(u => {
            if (u.id === unitId) {
                // @ts-ignore
                const currentVal = u.errors[errorType];
                const newVal = Math.min(99, Math.max(0, currentVal + delta));
                return { ...u, errors: { ...u.errors, [errorType]: newVal } };
            }
            return u;
        }));
        await updateUnitError(unitId, errorType, delta);
    };

    const handleCompletionStatusChange = async (unitId: number, status: 'incomplete' | 'in-progress' | 'completed') => {
        setUnits(prev => prev.map(u => u.id === unitId ? { ...u, completionStatus: status } : u));
        await updateCompletionStatus(unitId, status);
    };

    const handleAddUnit = async () => {
        const name = newUnitName.trim() || "새 단원";
        setIsAddUnitOpen(false);
        setNewUnitName("");
        setNewUnitGrade("고1");

        // Pass grade to addUnit
        await addUnit(String(studentId), name, newUnitGrade);
    };

    // Filter logic
    const filteredUnits = units.filter(unit => {
        // Grade Filter
        // @ts-ignore - unit type needs update or we assume dynamic property if not typed
        const unitGrade = unit.grade || "고1";
        if (selectedGrade !== "all" && unitGrade !== selectedGrade) return false;

        // Status Filter
        if (activeTab === "all") return true;
        if (activeTab === "in-progress") return unit.completionStatus === "in-progress";
        if (activeTab === "completed") return unit.completionStatus === "completed";
        if (activeTab === "incomplete") return unit.completionStatus === "incomplete" || !unit.completionStatus;
        return true;
    });

    return (
        <div className="p-8 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">나의 학습 관리</h1>
                    <p className="text-gray-500 mt-1">단원별 학습 진도를 관리하고 오답을 체크하세요.</p>
                </div>

                <div className="flex gap-4">
                    {/* Grade Filter */}
                    <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="학년 선택" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">전체 학년</SelectItem>
                            <SelectItem value="중1">중1</SelectItem>
                            <SelectItem value="중2">중2</SelectItem>
                            <SelectItem value="중3">중3</SelectItem>
                            <SelectItem value="고1">고1</SelectItem>
                            <SelectItem value="고2">고2</SelectItem>
                            <SelectItem value="고3">고3</SelectItem>
                        </SelectContent>
                    </Select>

                    <Dialog open={isAddUnitOpen} onOpenChange={setIsAddUnitOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                단원 추가
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>새 단원 추가</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">학년</Label>
                                    <Select value={newUnitGrade} onValueChange={setNewUnitGrade}>
                                        <SelectTrigger className="col-span-3">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="중1">중1</SelectItem>
                                            <SelectItem value="중2">중2</SelectItem>
                                            <SelectItem value="중3">중3</SelectItem>
                                            <SelectItem value="고1">고1</SelectItem>
                                            <SelectItem value="고2">고2</SelectItem>
                                            <SelectItem value="고3">고3</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="name" className="text-right">
                                        단원명
                                    </Label>
                                    <Input
                                        id="name"
                                        value={newUnitName}
                                        onChange={(e) => setNewUnitName(e.target.value)}
                                        placeholder="예: 지수와 로그"
                                        className="col-span-3"
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddUnit()}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleAddUnit}>추가하기</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList>
                    <TabsTrigger value="all">전체 ({units.length})</TabsTrigger>
                    <TabsTrigger value="incomplete">미완료 ({units.filter(u => u.completionStatus === 'incomplete' || !u.completionStatus).length})</TabsTrigger>
                    <TabsTrigger value="in-progress">진행 중 ({units.filter(u => u.completionStatus === 'in-progress').length})</TabsTrigger>
                    <TabsTrigger value="completed">완료 ({units.filter(u => u.completionStatus === 'completed').length})</TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredUnits.length > 0 ? (
                            filteredUnits.map((unit) => (
                                <div key={unit.id} className="relative group">
                                    <UnitCard
                                        unit={unit}
                                        onDifficultyChange={handleDifficultyChange}
                                        onUpdateDetails={handleUpdateDetails}
                                        onDelete={handleDelete}
                                        onErrorChange={handleErrorChange}
                                        showDeleteButton={false} // Hidden as requested
                                        onCompletionStatusChange={handleCompletionStatusChange}
                                        isAdmin={false}
                                        showDifficultySelector={false}
                                    />
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full text-center py-20 bg-white rounded-xl border border-gray-100 shadow-sm">
                                <p className="text-gray-400">등록된 단원이 없습니다.</p>
                            </div>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
