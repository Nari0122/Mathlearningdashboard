"use client";

import { useState, useEffect } from "react";
import { BookOpen } from "lucide-react";
import { OverallProgress } from "@/components/features/dashboard/OverallProgress";
import { AchievementDistribution } from "@/components/features/dashboard/AchievementDistribution";
import { TotalErrorAnalysis } from "@/components/features/dashboard/TotalErrorAnalysis";
import { UnitCard } from "@/components/features/dashboard/UnitCard-v2";
import { GuideCard } from "@/components/features/dashboard/GuideCard";
import { Unit } from "@/types";
import Link from "next/link";
import {
    updateUnitDifficulty,
    updateUnitName,
    deleteUnit,
    updateUnitError
} from "@/actions/unit-actions";

interface DashboardClientProps {
    initialUnits: Unit[];
    studentId: number;
}

export default function DashboardClient({ initialUnits, studentId }: DashboardClientProps) {
    // Keep local state for optimistic updates, or just rely on router refresh.
    // For smoother UX, we can use local state initialized from props.
    // However, since we use revalidatePath in actions, Next.js will update props.
    // But standard is optimistic UI. For simplicity in this demo, we trust props update or use simple local state that syncs?
    // Actually, let's use the props directly if possible, but we need interactivity.
    // If we use Server Actions with revalidatePath, the page props will update.
    // But we are inside a client component so we might need `useRouter().refresh()`.

    // Let's use simple local state initialized from props for immediate feedback + optimistic.
    // But wait, if we use local state, we must sync it with props when props change (revalidation).
    const [units, setUnits] = useState<Unit[]>(initialUnits);

    // Sync props to state when server data changes
    useEffect(() => {
        setUnits(initialUnits);
    }, [initialUnits]);

    // Handlers wrapping Server Actions
    const handleDifficultyChange = async (unitId: number, difficulty: string) => {
        // Optimistic
        setUnits(prev => prev.map(u => u.id === unitId ? { ...u, selectedDifficulty: difficulty } : u));
        await updateUnitDifficulty(unitId, difficulty);
    };

    const handleNameChange = async (unitId: number, newName: string) => {
        setUnits(prev => prev.map(u => u.id === unitId ? { ...u, name: newName } : u));
        await updateUnitName(unitId, newName);
    };

    const handleDelete = async (unitId: number) => {
        // No delete on dashboard usually, but code had it logic
        setUnits(prev => prev.filter(u => u.id !== unitId));
        await deleteUnit(unitId);
    };

    const handleErrorChange = async (unitId: number, errorType: 'C' | 'M' | 'R' | 'S', delta: number) => {
        setUnits(prev => prev.map(u => {
            if (u.id === unitId) {
                const currentVal = u.errors[errorType];
                const newVal = Math.max(0, currentVal + delta);
                return { ...u, errors: { ...u.errors, [errorType]: newVal } };
            }
            return u;
        }));
        await updateUnitError(unitId, errorType, delta);
    };

    // Derived State
    const completedUnits = units.filter(u => u.completionStatus === 'completed').length;
    const totalUnits = units.length;
    const activeUnits = units.filter(u => u.completionStatus !== 'completed');
    const learningRecordsCount = 3; // Mock count for now

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-8">
            {/* Top 3 Cards - Removed as requested */}
            {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <OverallProgress units={units} />
                <AchievementDistribution units={units} />
                <TotalErrorAnalysis units={units} />
            </div> */}

            {/* Middle Section: Learning Progress & Records Shortcuts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Completion Progress */}
                <Link
                    href="/study/my-learning"
                    className="bg-white border-2 border-gray-100 rounded-2xl shadow-sm p-6 hover:border-gray-300 hover:shadow transition-all text-left group"
                >
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">학습 완료 현황</h3>
                            <p className="text-gray-500 text-sm">클릭하여 전체 단원 보기</p>
                        </div>
                        <BookOpen size={28} className="text-gray-300 group-hover:text-blue-500 transition-colors" />
                    </div>
                    <div className="flex items-end justify-between mb-4">
                        <div>
                            <p className="text-5xl font-bold text-gray-900 mb-2">{completedUnits}</p>
                            <p className="text-gray-600">/ {totalUnits}개 단원 완료</p>
                        </div>
                        <div className="text-right">
                            <p className="text-3xl font-bold text-gray-900">
                                {totalUnits > 0 ? Math.round((completedUnits / totalUnits) * 100) : 0}%
                            </p>
                            <p className="text-sm text-gray-500">완료율</p>
                        </div>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gray-900 transition-all duration-500"
                            style={{ width: `${totalUnits > 0 ? (completedUnits / totalUnits) * 100 : 0}%` }}
                        />
                    </div>
                </Link>

                {/* Learning Records Shortcut */}
                <Link
                    href="/study/history"
                    className="bg-white border-2 border-gray-100 rounded-2xl shadow-sm p-6 hover:border-gray-300 hover:shadow transition-all text-left group"
                >
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">학습 기록</h3>
                            <p className="text-gray-500 text-sm">선생님이 작성한 학습 일지</p>
                        </div>
                        <BookOpen size={32} className="text-gray-300 group-hover:text-blue-500 transition-colors" />
                    </div>
                    <div className="flex items-end justify-between">
                        <div>
                            <p className="text-5xl font-bold text-gray-900">{learningRecordsCount}</p>
                            <p className="text-gray-600 mt-1">개의 기록</p>
                        </div>
                        <div className="text-sm text-gray-400 group-hover:text-blue-500 transition-colors">
                            클릭하여 확인 →
                        </div>
                    </div>
                </Link>
            </div>

            {/* Bottom Section: Active Units List & Guide */}
            <div className="flex flex-col lg:flex-row gap-6">
                {/* Active Units List */}
                <div className="flex-1">
                    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 min-h-[500px]">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold text-gray-900">내 단원 학습 현황</h2>
                            <div className="bg-gray-50 px-4 py-2 rounded-lg border border-gray-200 hidden">
                                <p className="text-sm text-gray-900">
                                    <span className="font-semibold">{activeUnits.length}</span>개 단원 진행 중
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {activeUnits.map((unit) => (
                                <UnitCard
                                    key={unit.id}
                                    unit={unit}
                                    onDifficultyChange={handleDifficultyChange}
                                    onNameChange={handleNameChange}
                                    onDelete={handleDelete}
                                    onErrorChange={handleErrorChange}
                                    showDeleteButton={false}
                                    isAdmin={false}
                                    showDifficultySelector={false}
                                />
                            ))}
                        </div>

                        {activeUnits.length === 0 && (
                            <div className="text-center py-20">
                                <p className="text-gray-500 font-medium">진행 중인 단원이 없습니다.</p>
                                <p className="text-sm text-gray-400 mt-2">모든 단원을 완료했거나 아직 시작하지 않았습니다.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Guide Card */}
                <div className="w-full lg:w-80">
                    <GuideCard units={units} />
                </div>
            </div>
        </div>
    );
}
