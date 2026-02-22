"use client";

import { BookOpen, Calculator, FileText, Lightbulb, Target, TrendingUp, Award } from 'lucide-react';
import { Unit } from "@/types";

interface GuideCardProps {
    units: Unit[];
}

export function GuideCard({ units }: GuideCardProps) {
    const totalUnits = units.length;
    const highUnits = units.filter(u => u.selectedDifficulty === '상').length;
    const totalErrors = units.reduce((sum, u) => sum + u.errors.C + u.errors.M + u.errors.R + u.errors.S, 0);
    const avgErrorsPerUnit = totalUnits > 0 ? (totalErrors / totalUnits).toFixed(1) : '0';

    return (
        <div className="space-y-4 sticky top-8">
            {/* Guide Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-center gap-2 mb-6">
                    <div className="w-8 h-8 bg-black/10 rounded-full flex items-center justify-center">
                        <Lightbulb size={18} className="text-gray-900" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">오답 원인 가이드</h3>
                </div>

                <div className="space-y-3 text-sm">
                    <div className="whitespace-nowrap">
                        <span className="font-bold text-gray-900">C:개념</span>
                        <span className="ml-2 text-gray-600">공식이나 정의를 모름</span>
                    </div>
                    <div className="whitespace-nowrap">
                        <span className="font-bold text-gray-900">M:계산</span>
                        <span className="ml-2 text-gray-600">풀이 과정 중 산수 실수</span>
                    </div>
                    <div className="whitespace-nowrap">
                        <span className="font-bold text-gray-900">R:독해</span>
                        <span className="ml-2 text-gray-600">문제의 요구사항을 잘못 해석</span>
                    </div>
                    <div className="whitespace-nowrap">
                        <span className="font-bold text-gray-900">S:전략</span>
                        <span className="ml-2 text-gray-600">접근 방법이나 아이디어를 못 냄</span>
                    </div>
                </div>
            </div>

            {/* Quick Stats Card */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                    <Target size={18} className="text-gray-600" />
                    <h3 className="font-semibold text-gray-900">학습 현황</h3>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-2">
                            <Award size={16} className="text-gray-600" />
                            <span className="text-sm text-gray-700">상 단계 단원</span>
                        </div>
                        <span className="text-lg font-bold text-gray-900">{highUnits}</span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-2">
                            <TrendingUp size={16} className="text-gray-600" />
                            <span className="text-sm text-gray-700">전체 단원</span>
                        </div>
                        <span className="text-lg font-bold text-gray-900">{totalUnits}</span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-2">
                            <Calculator size={16} className="text-gray-600" />
                            <span className="text-sm text-gray-700">평균 오답</span>
                        </div>
                        <span className="text-lg font-bold text-gray-900">{avgErrorsPerUnit}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
