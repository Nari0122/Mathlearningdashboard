"use client";

import { Unit } from "@/types";

interface AchievementDistributionProps {
    units: Unit[];
}

export function AchievementDistribution({ units }: AchievementDistributionProps) {
    const counts = {
        '상': units.filter(u => u.selectedDifficulty === '상').length,
        '중': units.filter(u => u.selectedDifficulty === '중').length,
        '하': units.filter(u => u.selectedDifficulty === '하').length
    };

    const levels = [
        { label: '상', count: counts['상'], color: '#FF6384' },
        { label: '중', count: counts['중'], color: '#36A2EB' },
        { label: '하', count: counts['하'], color: '#FFCE56' }
    ];

    const maxCount = Math.max(...levels.map(l => l.count), 1);

    return (
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-sm text-gray-500 uppercase tracking-wider mb-4 font-bold">Achievement Distribution</h3>

            <div className="space-y-3 flex flex-col justify-center" style={{ height: '128px' }}>
                {levels.map((level) => {
                    const widthPercentage = maxCount > 0 ? (level.count / maxCount) * 100 : 0;

                    return (
                        <div key={level.label} className="flex items-center gap-3">
                            <div className="w-8 text-center font-bold text-gray-700 text-sm">{level.label}</div>
                            <div className="flex-1 bg-gray-100 rounded-full h-8 relative overflow-hidden">
                                <div
                                    className="h-8 rounded-full transition-all duration-500 flex items-center justify-end pr-3"
                                    style={{
                                        width: `${widthPercentage}%`,
                                        backgroundColor: level.color,
                                        minWidth: level.count > 0 ? '40px' : '0px'
                                    }}
                                >
                                    {level.count > 0 && (
                                        <span className="text-white font-bold text-sm">{level.count}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
