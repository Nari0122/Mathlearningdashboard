"use client";

import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Unit } from "@/types";
import { X } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { isMiddleSchool } from "@/lib/curriculum-data";

interface AnalysisClientProps {
    units: Unit[];
}

const COLORS = ['#3b82f6', '#ef4444', '#f97316', '#a855f7']; // C, M, R, S colors

export default function AnalysisClient({ units }: AnalysisClientProps) {
    const [selectedLevel, setSelectedLevel] = useState<string>("all");
    const [selectedGrade, setSelectedGrade] = useState<string>("all");
    const [selectedSubject, setSelectedSubject] = useState<string>("all");
    const [selectedUnitName, setSelectedUnitName] = useState<string>("all");
    const [selectedDetail, setSelectedDetail] = useState<string>("all");

    // Extract unique levels, grades and subjects
    const levels = useMemo(() => {
        const unique = new Set(units.map(u => u.schoolLevel).filter(Boolean));
        return Array.from(unique).sort();
    }, [units]);

    const grades = useMemo(() => {
        let filtered = units;
        if (selectedLevel !== "all") {
            filtered = filtered.filter(u => u.schoolLevel === selectedLevel);
        }
        const unique = new Set(filtered.map(u => u.grade).filter(Boolean));
        return Array.from(unique).sort();
    }, [units, selectedLevel]);

    const subjects = useMemo(() => {
        let filtered = units;
        if (selectedLevel !== "all") {
            filtered = filtered.filter(u => u.schoolLevel === selectedLevel);
        }
        if (selectedGrade !== "all") {
            filtered = filtered.filter(u => u.grade === selectedGrade);
        }
        const unique = new Set(filtered.map(u => u.subject).filter(Boolean));
        return Array.from(unique).sort();
    }, [units, selectedLevel, selectedGrade]);

    const unitNames = useMemo(() => {
        let filtered = units;
        if (selectedLevel !== "all") filtered = filtered.filter(u => u.schoolLevel === selectedLevel);
        if (selectedGrade !== "all") filtered = filtered.filter(u => u.grade === selectedGrade);
        if (selectedSubject !== "all") filtered = filtered.filter(u => u.subject === selectedSubject);
        const unique = new Set(filtered.map(u => u.unitName || u.name).filter(Boolean));
        return Array.from(unique).sort();
    }, [units, selectedLevel, selectedGrade, selectedSubject]);

    const details = useMemo(() => {
        let filtered = units;
        if (selectedLevel !== "all") filtered = filtered.filter(u => u.schoolLevel === selectedLevel);
        if (selectedGrade !== "all") filtered = filtered.filter(u => u.grade === selectedGrade);
        if (selectedSubject !== "all") filtered = filtered.filter(u => u.subject === selectedSubject);
        if (selectedUnitName !== "all") filtered = filtered.filter(u => (u.unitName || u.name) === selectedUnitName);
        const allDetails = filtered.flatMap(u => u.unitDetails || []);
        return Array.from(new Set(allDetails)).sort();
    }, [units, selectedLevel, selectedGrade, selectedSubject, selectedUnitName]);

    const resetFilters = () => {
        setSelectedLevel("all");
        setSelectedGrade("all");
        setSelectedSubject("all");
        setSelectedUnitName("all");
        setSelectedDetail("all");
    };

    // Helper function (still useful for Middle School or checks)
    const getUnitDisplayName = (unit: Unit) => {
        const baseName = (unit.schoolLevel !== '중등' && unit.unitDetails && unit.unitDetails.length > 0)
            ? unit.unitDetails[0]
            : (unit.unitName || unit.name);
        return `${unit.grade}/${baseName}`;
    };

    const getDetailedUnitName = (u: Unit) => {
        // Format:
        // Middle School: SchoolLevel / Grade / Subject / Parent(unitName) / Sub(name)
        // High School: SchoolLevel / Grade / Subject / Parent(unitName) / Sub(name) / Detail(unitDetails joined)

        let parts = [
            u.schoolLevel,
            u.grade,
            u.subject,
            u.unitName,
            u.name
        ];

        // For High School, append detail parts if available
        if (u.schoolLevel === '고등' && u.unitDetails && u.unitDetails.length > 0) {
            parts = [...parts, ...u.unitDetails];
        }

        const validParts = parts.filter(Boolean);

        // Remove adjacent duplicates
        return validParts.filter((item, pos, arr) => !pos || item !== arr[pos - 1]).join(' / ');
    };

    // Aggregation Logic
    const aggregatedData = useMemo(() => {
        const map = new Map<string, { id: string | number, name: string, errors: { C: number, M: number, R: number, S: number } }>();

        units.forEach(u => {
            let key: string;
            let displayName: string;

            if (u.schoolLevel === '중등') {
                // Middle School: Keep detailed (unique per unit ID)
                key = `mid-${u.id}`;
                displayName = getUnitDisplayName(u);
            } else {
                // High School: Aggregate by Parent Category (unitName)
                // If unitName is missing, fall back to name.
                key = `high-${u.unitName || u.name}`;
                // Prepend grade to the aggregated parent name as well
                displayName = `${u.grade}/${u.unitName || u.name}`;
            }

            if (!map.has(key)) {
                map.set(key, {
                    id: key,
                    name: displayName,
                    errors: { C: 0, M: 0, R: 0, S: 0 }
                });
            }

            const entry = map.get(key)!;
            entry.errors.C += u.errors.C;
            entry.errors.M += u.errors.M;
            entry.errors.R += u.errors.R;
            entry.errors.S += u.errors.S;
        });

        return Array.from(map.values());
    }, [units]);

    // 1. Data Prep for Bar Chart (use aggregatedData)
    const barData = aggregatedData.map(u => ({
        name: u.name,
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

    const sortedUnits = useMemo(() => {
        let filtered = units.filter(u => {
            const matchesLevel = selectedLevel === "all" || u.schoolLevel === selectedLevel;
            const matchesGrade = selectedGrade === "all" || u.grade === selectedGrade;
            const matchesSubject = selectedSubject === "all" || u.subject === selectedSubject;
            const matchesUnit = selectedUnitName === "all" || (u.unitName || u.name) === selectedUnitName;
            const matchesDetail = selectedDetail === "all" || u.unitDetails?.includes(selectedDetail);
            return matchesLevel && matchesGrade && matchesSubject && matchesUnit && matchesDetail;
        });

        return filtered.sort((a, b) => {
            // Sort by Grade -> Subject -> UnitName -> Name
            if (a.grade !== b.grade) return a.grade.localeCompare(b.grade);
            if (a.subject !== b.subject) return a.subject.localeCompare(b.subject);
            if (a.unitName !== b.unitName) return (a.unitName || "").localeCompare(b.unitName || "");
            return a.name.localeCompare(b.name);
        });
    }, [units, selectedLevel, selectedGrade, selectedSubject, selectedUnitName, selectedDetail]);


    return (
        <div className="space-y-4 md:space-y-8">
            {/* Header */}
            <div>
                <h2 className="text-lg md:text-xl font-bold tracking-tight">오답 유형 분석</h2>
                <p className="text-xs md:text-sm text-gray-500 mt-1">단원별 및 전체 오답 분포를 확인합니다.</p>
            </div>

            {/* Cascading Filters */}
            <div className="flex flex-wrap items-center gap-2">
                <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                    <SelectTrigger className="w-[120px] h-9">
                        <SelectValue placeholder="학제" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">전체 학제</SelectItem>
                        {levels.map((l: any) => (
                            <SelectItem key={l} value={l}>{l}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                    <SelectTrigger className="w-[120px] h-9">
                        <SelectValue placeholder="학년" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">전체 학년</SelectItem>
                        {grades.map((g: any) => (
                            <SelectItem key={g} value={g}>{g}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                    <SelectTrigger className="w-[120px] h-9">
                        <SelectValue placeholder="과목" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">전체 과목</SelectItem>
                        {subjects.map((s: any) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={selectedUnitName} onValueChange={setSelectedUnitName}>
                    <SelectTrigger className="w-[140px] h-9">
                        <SelectValue placeholder="단원" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">전체 단원</SelectItem>
                        {unitNames.map((u: any) => (
                            <SelectItem key={u} value={u}>{u}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* 세부내용 필터 - 고등만 표시 */}
                {selectedLevel !== "all" && !isMiddleSchool(selectedLevel) && (
                    <Select value={selectedDetail} onValueChange={setSelectedDetail}>
                        <SelectTrigger className="w-[140px] h-9">
                            <SelectValue placeholder="세부내용" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">전체 세부내용</SelectItem>
                            {details.map((d: any) => (
                                <SelectItem key={d} value={d}>{d}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}

                {(selectedLevel !== "all" || selectedGrade !== "all" || selectedSubject !== "all" || selectedUnitName !== "all" || selectedDetail !== "all") && (
                    <Button variant="ghost" size="icon" onClick={resetFilters} title="필터 초기화" className="h-9 w-9">
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </div>

            {/* --- Mobile View (md:hidden) --- */}
            <div className="md:hidden space-y-4">
                {/* 1. Bar Chart Card */}
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">단원별 오답 분포</h3>
                    <div className="h-[250px] w-full">
                        {barData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis
                                        dataKey="name"
                                        fontSize={10}
                                        tickLine={false}
                                        axisLine={false}
                                        interval={0}
                                        tickFormatter={(val) => val.length > 5 ? `${val.slice(0, 5)}..` : val}
                                    />
                                    <YAxis fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                                        cursor={{ fill: '#f3f4f6' }}
                                    />
                                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                                    <Bar dataKey="C" name="개념" stackId="a" fill={COLORS[0]} radius={[0, 0, 4, 4]} />
                                    <Bar dataKey="M" name="계산" stackId="a" fill={COLORS[1]} />
                                    <Bar dataKey="R" name="독해" stackId="a" fill={COLORS[2]} />
                                    <Bar dataKey="S" name="전략" stackId="a" fill={COLORS[3]} radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-400 text-xs">
                                데이터가 없습니다.
                            </div>
                        )}
                    </div>
                </div>

                {/* 2. Pie Chart Card (Side-by-Side Layout) */}
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">전체 오답 유형 비율</h3>
                    <div className="flex flex-row items-center justify-between">
                        {/* Left: Chart */}
                        <div className="h-[180px] w-[55%] relative flex items-center justify-center">
                            {totalCount > 0 ? (
                                <>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={pieData}
                                                innerRadius={45}
                                                outerRadius={65}
                                                paddingAngle={2}
                                                dataKey="value"
                                            >
                                                {pieData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip contentStyle={{ fontSize: '12px' }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                                        <div className="text-lg font-bold text-gray-900">{totalCount}</div>
                                        <div className="text-[10px] text-gray-500">Total</div>
                                    </div>
                                </>
                            ) : (
                                <div className="text-gray-400 text-xs">
                                    데이터 없음
                                </div>
                            )}
                        </div>

                        {/* Right: Legend */}
                        <div className="flex flex-col gap-3 w-[40%]">
                            {pieData.map(d => (
                                <div key={d.name} className="flex flex-col">
                                    <span className="text-[10px] text-gray-500 mb-0.5">{d.name}</span>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                                        <span className="text-sm font-bold text-gray-900">
                                            {Math.round(d.value / totalCount * 100)}%
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>


            </div>

            {/* --- Desktop View (hidden md:block) --- */}
            <div className="hidden md:block space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Bar Chart: Unit breakdown (Aggregated) */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <h3 className="font-semibold text-gray-900 mb-6">단원별 오답 분포</h3>
                        <div className="h-[300px] w-full">
                            {barData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis
                                            dataKey="name"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                            interval={0}
                                            tickFormatter={(val) => val.length > 12 ? `${val.slice(0, 12)}...` : val}
                                        />
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
            </div>

            {/* Unified Unit Details Grid (Replaces separate Table/List) - Visible on ALL screens */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="text-sm md:text-base font-semibold text-gray-900 mb-4">단원별 상세 분석</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {sortedUnits.length > 0 ? sortedUnits.map(u => {
                        const sum = u.errors.C + u.errors.M + u.errors.R + u.errors.S;
                        return (
                            <div key={u.id} className="p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                    <p className="text-sm font-bold text-gray-900 flex-1 mr-2 break-keep leading-tight">
                                        {getDetailedUnitName(u)}
                                    </p>
                                    <span className="px-2 py-0.5 bg-white border border-gray-200 rounded-md text-xs font-bold text-gray-700 whitespace-nowrap shadow-sm">
                                        {sum}건
                                    </span>
                                </div>
                                <div className="grid grid-cols-4 gap-2 text-center">
                                    <div className="flex flex-col items-center bg-white p-2 rounded-lg border border-gray-100 shadow-sm">
                                        <span className="text-[10px] text-gray-500 mb-0.5">개념</span>
                                        <span className="text-sm font-bold text-blue-600">{u.errors.C}</span>
                                    </div>
                                    <div className="flex flex-col items-center bg-white p-2 rounded-lg border border-gray-100 shadow-sm">
                                        <span className="text-[10px] text-gray-500 mb-0.5">계산</span>
                                        <span className="text-sm font-bold text-red-600">{u.errors.M}</span>
                                    </div>
                                    <div className="flex flex-col items-center bg-white p-2 rounded-lg border border-gray-100 shadow-sm">
                                        <span className="text-[10px] text-gray-500 mb-0.5">독해</span>
                                        <span className="text-sm font-bold text-orange-600">{u.errors.R}</span>
                                    </div>
                                    <div className="flex flex-col items-center bg-white p-2 rounded-lg border border-gray-100 shadow-sm">
                                        <span className="text-[10px] text-gray-500 mb-0.5">전략</span>
                                        <span className="text-sm font-bold text-purple-600">{u.errors.S}</span>
                                    </div>
                                </div>
                            </div>
                        )
                    }) : (
                        <div className="col-span-full text-center py-12 text-gray-400 text-sm bg-gray-50 rounded-xl border border-dashed border-gray-200">
                            데이터가 없습니다.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

}
