"use client";

import { useState } from "react";
import { BookOpen } from "lucide-react";
import { OverallProgress } from "@/components/features/dashboard/OverallProgress";
import { AchievementDistribution } from "@/components/features/dashboard/AchievementDistribution";
import { TotalErrorAnalysis } from "@/components/features/dashboard/TotalErrorAnalysis";
import { UnitCard } from "@/components/features/dashboard/UnitCard-v2";
import { GuideCard } from "@/components/features/dashboard/GuideCard";
import { Unit } from "@/types";
import Link from "next/link";

// Mock Data (Migrated from App.tsx)
const INITIAL_UNITS: Unit[] = [
    {
        id: 1,
        name: "집합과 명제",
        unitName: "집합과 명제",
        schoolLevel: "고등",
        grade: "고1",
        subject: "수학",
        unitDetails: [],
        status: "HIGH",
        errors: { C: 2, M: 1, R: 0, S: 1 },
        selectedDifficulty: "상",
        completionStatus: "completed"
    },
    {
        id: 2,
        name: "함수",
        unitName: "함수",
        schoolLevel: "고등",
        grade: "고1",
        subject: "수학",
        unitDetails: [],
        status: "MID",
        errors: { C: 1, M: 2, R: 1, S: 0 },
        selectedDifficulty: "중",
        completionStatus: "in-progress"
    },
    {
        id: 3,
        name: "방정식과 부등식",
        unitName: "방정식과 부등식",
        schoolLevel: "고등",
        grade: "고1",
        subject: "수학",
        unitDetails: [],
        status: "LOW",
        errors: { C: 0, M: 1, R: 0, S: 1 },
        selectedDifficulty: "하",
        completionStatus: "completed"
    },
    {
        id: 4,
        name: "도형의 방정식",
        unitName: "도형의 방정식",
        schoolLevel: "고등",
        grade: "고1",
        subject: "수학",
        unitDetails: [],
        status: "MID",
        errors: { C: 2, M: 0, R: 1, S: 2 },
        selectedDifficulty: "상",
        completionStatus: "incomplete"
    }
];

export default function DashboardPage() {
    // State for interactivity (Mocking local state until DB integration)
    const [units, setUnits] = useState<Unit[]>(INITIAL_UNITS);

    // Mock Handlers
    const handleDifficultyChange = (unitId: number, difficulty: string) => {
        setUnits(prev => prev.map(u => u.id === unitId ? { ...u, selectedDifficulty: difficulty } : u));
    };

    const handleNameChange = (unitId: number, newName: string) => {
        setUnits(prev => prev.map(u => u.id === unitId ? { ...u, name: newName } : u));
    };

    const handleDelete = (unitId: number) => {
        setUnits(prev => prev.filter(u => u.id !== unitId));
    };

    const handleErrorChange = (unitId: number, errorType: 'C' | 'M' | 'R' | 'S', delta: number) => {
        setUnits(prev => prev.map(u => {
            if (u.id === unitId) {
                const currentVal = u.errors[errorType];
                const newVal = Math.max(0, currentVal + delta);
                return { ...u, errors: { ...u.errors, [errorType]: newVal } };
            }
            return u;
        }));
    };

    // Derived State
    const completedUnits = units.filter(u => u.completionStatus === 'completed').length;
    const totalUnits = units.length;
    const activeUnits = units.filter(u => u.completionStatus !== 'completed');
    const learningRecordsCount = 3; // Mock count

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-8">
            {/* Top 3 Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <OverallProgress units={units} />
                <AchievementDistribution units={units} />
                <TotalErrorAnalysis units={units} />
            </div>

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
