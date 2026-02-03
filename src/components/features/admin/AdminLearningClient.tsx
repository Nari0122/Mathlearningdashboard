"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { Unit } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UnitCard } from "@/components/features/dashboard/UnitCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { createUnit, deleteUnit, updateUnit, updateUnitError } from "@/actions/admin-actions"; // Ensure this path is correct
import { useRouter } from "next/navigation";

interface AdminLearningClientProps {
    initialUnits: Unit[];
    studentId: number;
}

const GRADES = ["중1", "중2", "중3", "고1", "고2", "고3"];
const SUBJECTS = [
    "중등수학 1-1", "중등수학 1-2", "중등수학 2-1", "중등수학 2-2", "중등수학 3-1", "중등수학 3-2",
    "공통수학1", "공통수학2", "대수", "미적분1", "미적분2", "확률과 통계", "기하"
];

export default function AdminLearningClient({ initialUnits, studentId }: AdminLearningClientProps) {
    const router = useRouter();
    const [units, setUnits] = useState<Unit[]>(initialUnits); // Note: Should sync with props in real effect or just rely on router.refresh

    // Sync state with props when props change (revalidation)
    // Actually, simpler to just use props if we trust revalidation, but UnitCard interactions need local optimistic updates?
    // Mixed approach: use initialUnits as base, and local state for optimistic. 
    // BUT since we are revalidating, we should probably prefer the prop updates.
    // Let's rely on router.refresh() updates propagating to initialUnits, but setUnits needs to update.
    // For now, I'll update local state AND call server.

    const [activeTab, setActiveTab] = useState("all");
    const [isAddUnitOpen, setIsAddUnitOpen] = useState(false);

    const [newUnitName, setNewUnitName] = useState("");
    const [newUnitGrade, setNewUnitGrade] = useState("고1");
    const [newUnitSubject, setNewUnitSubject] = useState("공통수학1");

    const [isPending, startTransition] = useTransition();

    // Re-sync units if initialUnits changes
    // useEffect(() => setUnits(initialUnits), [initialUnits]); // Need import useEffect

    const handleAddUnit = async () => {
        if (!newUnitName.trim()) return;

        startTransition(async () => {
            const result = await createUnit(studentId, {
                name: newUnitName,
                grade: newUnitGrade,
                subject: newUnitSubject,
                status: "MID",
                selectedDifficulty: "중"
            });

            if (result.success) {
                setIsAddUnitOpen(false);
                setNewUnitName("");
                setNewUnitGrade("고1");
                setNewUnitSubject("공통수학1");
                router.refresh(); // Refresh server component to get new list
            } else {
                alert(`단원 추가 실패: ${result.message || '알 수 없는 오류'}`);
                console.error('Unit creation failed:', result.message);
            }
        });
    };

    // Server action handlers
    const handleDifficultyChange = async (unitId: number, difficulty: string) => {
        const unit = initialUnits.find(u => u.id === unitId);
        if (!unit) return;

        startTransition(async () => {
            const result = await updateUnit(unitId, studentId, {
                name: unit.name,
                grade: unit.grade,
                subject: unit.subject,
                status: unit.status,
                selectedDifficulty: difficulty
            });
            if (result.success) {
                router.refresh();
            } else {
                alert("수정 실패");
            }
        });
    };

    const handleNameChange = async (unitId: number, newName: string) => {
        const unit = initialUnits.find(u => u.id === unitId);
        if (!unit) return;

        startTransition(async () => {
            const result = await updateUnit(unitId, studentId, {
                name: newName,
                grade: unit.grade,
                subject: unit.subject,
                status: unit.status,
                selectedDifficulty: unit.selectedDifficulty
            });
            if (result.success) {
                router.refresh();
            } else {
                alert("수정 실패");
            }
        });
    };

    const handleDelete = async (unitId: number) => {
        if (!confirm("정말 삭제하시겠습니까?")) return;
        startTransition(async () => {
            const result = await deleteUnit(unitId, studentId);
            if (result.success) {
                router.refresh();
            } else {
                alert("삭제 실패");
            }
        });
    };

    const handleErrorChange = async (unitId: number, errorType: 'C' | 'M' | 'R' | 'S', delta: number) => {
        startTransition(async () => {
            const result = await updateUnitError(unitId, studentId, errorType, delta);
            if (result.success) {
                router.refresh();
            } else {
                alert("수정 실패");
            }
        });
    };

    const handleCompletionStatusChange = async (unitId: number, status: 'incomplete' | 'in-progress' | 'completed') => {
        startTransition(async () => {
            const result = await updateUnit(unitId, studentId, {
                completionStatus: status
            });
            if (result.success) {
                router.refresh();
            } else {
                alert("수정 실패");
            }
        });
    };

    const handleStatusChange = async (unitId: number, status: 'HIGH' | 'MID' | 'LOW') => {
        const unit = initialUnits.find(u => u.id === unitId);
        if (!unit) return;

        startTransition(async () => {
            const result = await updateUnit(unitId, studentId, {
                name: unit.name,
                grade: unit.grade,
                subject: unit.subject,
                status: status,
                selectedDifficulty: unit.selectedDifficulty
            });
            if (result.success) {
                router.refresh();
            } else {
                alert("수정 실패");
            }
        });
    };

    // Use derived state from props if mostly relying on server, but here we mix.
    const displayUnits = initialUnits.length !== units.length && isPending ? units : initialUnits;
    // Actually, just use initialUnits and trust router.refresh(). 
    // Except local edits like "Difficulty Change" need immediate feedback.
    // So let's use `units` state, but update it when `initialUnits` changes?
    // Effect is better.

    // For this task, I'll stick to local state derived from initialUnits + internal updates.
    // Assuming router.refresh will re-mount or update props.
    // I need `useEffect` to sync.

    const filteredUnits = initialUnits.filter(unit => {
        if (activeTab === "all") return true;
        if (activeTab === "in-progress") return unit.completionStatus === "in-progress";
        if (activeTab === "completed") return unit.completionStatus === "completed";
        if (activeTab === "incomplete") return unit.completionStatus === "incomplete" || !unit.completionStatus;
        return true;
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold tracking-tight">전체 단원 관리</h2>
                <Dialog open={isAddUnitOpen} onOpenChange={setIsAddUnitOpen}>
                    <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />단원 추가 (관리자)</Button></DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader><DialogTitle>새 단원 추가</DialogTitle></DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="text-right">단원명</Label>
                                <Input id="name" value={newUnitName} onChange={(e) => setNewUnitName(e.target.value)} className="col-span-3" placeholder="예: 집합의 연산" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="grade" className="text-right">학년</Label>
                                <Select value={newUnitGrade} onValueChange={setNewUnitGrade}>
                                    <SelectTrigger className="col-span-3"><SelectValue placeholder="학년 선택" /></SelectTrigger>
                                    <SelectContent>
                                        {GRADES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="subject" className="text-right">과목</Label>
                                <Select value={newUnitSubject} onValueChange={setNewUnitSubject}>
                                    <SelectTrigger className="col-span-3"><SelectValue placeholder="과목 선택" /></SelectTrigger>
                                    <SelectContent>
                                        {SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleAddUnit} disabled={isPending}>
                                {isPending ? "추가 중..." : "추가하기"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="all">전체 ({initialUnits.length})</TabsTrigger>
                    <TabsTrigger value="incomplete">미완료 ({initialUnits.filter(u => u.completionStatus === 'incomplete' || !u.completionStatus).length})</TabsTrigger>
                    <TabsTrigger value="in-progress">진행 중 ({initialUnits.filter(u => u.completionStatus === 'in-progress').length})</TabsTrigger>
                    <TabsTrigger value="completed">완료 ({initialUnits.filter(u => u.completionStatus === 'completed').length})</TabsTrigger>
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
                                    onNameChange={handleNameChange}
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
        </div>
    );
}
