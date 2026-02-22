"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Unit } from '@/types';

interface OverallProgressProps {
    units: Unit[];
}

export function OverallProgress({ units }: OverallProgressProps) {
    const totalUnits = units.length;
    const completedWeight = units.filter(u => u.completionStatus === 'completed').length;
    const inProgressWeight = units.filter(u => u.completionStatus === 'in-progress').length * 0.5;
    const masteredPercentage = totalUnits > 0 ? Math.round(((completedWeight + inProgressWeight) / totalUnits) * 100) : 0;

    const data = [
        { name: 'Mastered', value: masteredPercentage },
        { name: 'Remaining', value: 100 - masteredPercentage }
    ];

    const COLORS = ['#3b82f6', '#e5e7eb'];

    return (
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-sm text-gray-500 uppercase tracking-wider mb-4 font-bold">Overall Progress</h3>

            <div className="relative h-32 flex items-center justify-center">
                <ResponsiveContainer width="100%" height={128}>
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={55}
                            paddingAngle={2}
                            dataKey="value"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index]} />
                            ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>

                <div className="absolute inset-0 flex items-center justify-center flex-col">
                    <div className="text-2xl font-bold text-gray-900">{masteredPercentage}%</div>
                    <p className="text-[10px] text-gray-500 mt-0.5 uppercase tracking-wider">MASTERED</p>
                </div>
            </div>
        </div>
    );
}
