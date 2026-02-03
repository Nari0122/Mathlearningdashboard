"use client";

import { useState } from "react";
import { OverallProgress } from "@/components/features/dashboard/OverallProgress";
import { AchievementDistribution } from "@/components/features/dashboard/AchievementDistribution";
import { TotalErrorAnalysis } from "@/components/features/dashboard/TotalErrorAnalysis";
import { GuideCard } from "@/components/features/dashboard/GuideCard";
import { Unit } from "@/types";

import { StudentStats } from "@/components/features/student/StudentStats";

interface StudentDashboardClientProps {
    initialUnits: Unit[];
    stats?: any | null;
}

export default function StudentDashboardClient({ initialUnits, stats }: StudentDashboardClientProps) {
    const [units] = useState<Unit[]>(initialUnits);

    // No admin handlers needed here (read-only)

    return (
        <div className="space-y-8">
            {/* Stats Section */}
            {stats && <StudentStats stats={stats} />}

            {/* Top 3 Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <OverallProgress units={units} />
                <AchievementDistribution units={units} />
                <TotalErrorAnalysis units={units} />
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Right Guide Card - Full width for student view since there's no unit list editing */}
                <div className="w-full">
                    <GuideCard units={units} />
                </div>
            </div>
        </div>
    );
}
