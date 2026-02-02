"use client";

import { useState } from "react";
import { OverallProgress } from "@/components/features/dashboard/OverallProgress";
import { AchievementDistribution } from "@/components/features/dashboard/AchievementDistribution";
import { TotalErrorAnalysis } from "@/components/features/dashboard/TotalErrorAnalysis";
import { UnitCard } from "@/components/features/dashboard/UnitCard";
import { GuideCard } from "@/components/features/dashboard/GuideCard";
import { Unit } from "@/types";

interface AdminStudentDashboardClientProps {
    initialUnits: Unit[];
}

export default function AdminStudentDashboardClient({ initialUnits }: AdminStudentDashboardClientProps) {
    const [units, setUnits] = useState<Unit[]>(initialUnits);

    // Mock Handlers (Admin has full control) - In real app, these should call Server Actions
    const handleDifficultyChange = (unitId: number, difficulty: string) => {
        setUnits(prev => prev.map(u => u.id === unitId ? { ...u, selectedDifficulty: difficulty } : u));
    };

    const handleNameChange = (unitId: number, newName: string) => {
        setUnits(prev => prev.map(u => u.id === unitId ? { ...u, name: newName } : u));
    };

    const handleDelete = (unitId: number) => {
        if (confirm("관리자 권한: 정말 삭제하시겠습니까?")) {
            setUnits(prev => prev.filter(u => u.id !== unitId));
        }
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

    const activeUnits = units.filter(u => u.completionStatus !== 'completed');

    return (
        <div className="space-y-8">
            {/* Top 3 Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <OverallProgress units={units} />
                <AchievementDistribution units={units} />
                <TotalErrorAnalysis units={units} />
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Right Guide Card */}
                <div className="w-full">
                    <GuideCard units={units} />
                </div>
            </div>
        </div>
    );
}
