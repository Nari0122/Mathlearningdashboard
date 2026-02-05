"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Unit } from "@/types";

interface AnalysisClientProps {
    units: Unit[];
}

const COLORS = ['#3b82f6', '#ef4444', '#f97316', '#a855f7']; // C, M, R, S colors

export default function AnalysisClient({ units }: AnalysisClientProps) {
    // Helper function to get display name based on school level
    const getUnitDisplayName = (unit: Unit) => {
        if (unit.schoolLevel !== '중등' && unit.unitDetails && unit.unitDetails.length > 0) {
            return unit.unitDetails[0];
        }
        return unit.unitName || unit.name;
    };

    // 1. Data Prep for Bar Chart
    const barData = units.map(u => ({
        name: getUnitDisplayName(u),
        C: u.errors.C,
        M: u.errors.M,
        R: u.errors.R,
        S: u.errors.S
    }));

    // 2. Data Prep for Pie Chart
    const totalErrors = units.reduce((acc, u) => ({
        C: acc.C + u.errors.C,
        M: acc.M + u.errors.M,
        R: acc.R + u.errors.R,
        S: acc.S + u.errors.S
    }), { C: 0, M: 0, R: 0, S: 0 });

    const pieData = [
        { name: '개념(C)', value: totalErrors.C, color: COLORS[0] },
        { name: '계산(M)', value: totalErrors.M, color: COLORS[1] },
        { name: '독해(R)', value: totalErrors.R, color: COLORS[2] },
        { name: '전략(S)', value: totalErrors.S, color: COLORS[3] },
    ].filter(d => d.value > 0); // Hide zero segments

    const totalCount = Object.values(totalErrors).reduce((a, b) => a + b, 0);

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-xl font-bold tracking-tight">오답 유형 분석</h2>
                <p className="text-gray-500 mt-1">단원별 및 전체 오답 분포를 확인합니다.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Bar Chart: Unit breakdown */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <h3 className="font-semibold text-gray-900 mb-6">단원별 오답 분포</h3>
                    <div className="h-[300px] w-full">
                        {barData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        cursor={{ fill: '#f3f4f6' }}
                                    />
                                    <Legend />
                                    <Bar dataKey="C" name="개념" stackId="a" fill={COLORS[0]} radius={[0, 0, 4, 4]} />
                                    <Bar dataKey="M" name="계산" stackId="a" fill={COLORS[1]} />
                                    <Bar dataKey="R" name="독해" stackId="a" fill={COLORS[2]} />
                                    <Bar dataKey="S" name="전략" stackId="a" fill={COLORS[3]} radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                                데이터가 없습니다.
                            </div>
                        )}
                    </div>
                </div>

                {/* Pie Chart: Total composition */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <h3 className="font-semibold text-gray-900 mb-6">전체 오답 유형 비율</h3>
                    <div className="h-[300px] flex items-center justify-center relative">
                        {totalCount > 0 ? (
                            <>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            innerRadius={80}
                                            outerRadius={100}
                                            paddingAngle={2}
                                            dataKey="value"
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                                    <div className="text-3xl font-bold text-gray-900">{totalCount}</div>
                                    <div className="text-sm text-gray-500">Total Errors</div>
                                </div>
                            </>
                        ) : (
                            <div className="text-gray-400 text-sm">
                                오답 데이터가 없습니다. (0건)
                            </div>
                        )}
                    </div>
                    <div className="flex justify-center gap-4 mt-4">
                        {pieData.map(d => (
                            <div key={d.name} className="flex items-center gap-2 text-sm text-gray-600">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                                {d.name} ({Math.round(d.value / totalCount * 100)}%)
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Detailed Table (Optional for 'Analysis') */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-4 font-medium text-gray-600">단원명</th>
                            <th className="p-4 font-medium text-blue-600 text-center">개념(C)</th>
                            <th className="p-4 font-medium text-red-600 text-center">계산(M)</th>
                            <th className="p-4 font-medium text-orange-600 text-center">독해(R)</th>
                            <th className="p-4 font-medium text-purple-600 text-center">전략(S)</th>
                            <th className="p-4 font-medium text-gray-600 text-center">합계</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {units.length > 0 ? units.map(u => {
                            const sum = u.errors.C + u.errors.M + u.errors.R + u.errors.S;
                            return (
                                <tr key={u.id} className="hover:bg-gray-50">
                                    <td className="p-4 font-medium text-gray-900">{getUnitDisplayName(u)}</td>
                                    <td className="p-4 text-center">{u.errors.C || '-'}</td>
                                    <td className="p-4 text-center">{u.errors.M || '-'}</td>
                                    <td className="p-4 text-center">{u.errors.R || '-'}</td>
                                    <td className="p-4 text-center">{u.errors.S || '-'}</td>
                                    <td className="p-4 text-center font-bold bg-gray-50/50">{sum}</td>
                                </tr>
                            )
                        }) : (
                            <tr>
                                <td colSpan={6} className="p-8 text-center text-gray-400">데이터가 없습니다.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
