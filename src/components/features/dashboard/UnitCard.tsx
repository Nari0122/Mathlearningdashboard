"use client";

import { useState } from 'react';
import { Plus, Minus, Trash2, Check, X } from 'lucide-react';
import { Unit } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// 난이도와 STATUS 색상 통합 매핑 (단일 소스)
const getDifficultyStatusConfig = (difficulty: string) => {
    const configs = {
        '상': {
            status: 'HIGH',
            badgeColor: 'bg-red-100 text-red-700 hover:bg-red-100',
            buttonActive: 'bg-red-500 hover:bg-red-600',
            buttonInactive: 'bg-gray-100 text-gray-500 hover:bg-gray-200'
        },
        '중': {
            status: 'MID',
            badgeColor: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
            buttonActive: 'bg-blue-500 hover:bg-blue-600',
            buttonInactive: 'bg-gray-100 text-gray-500 hover:bg-gray-200'
        },
        '하': {
            status: 'LOW',
            badgeColor: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100',
            buttonActive: 'bg-yellow-500 hover:bg-yellow-600',
            buttonInactive: 'bg-gray-100 text-gray-500 hover:bg-gray-200'
        }
    };
    return configs[difficulty as keyof typeof configs] || configs['중'];
};

interface UnitCardProps {
    unit: Unit;
    onDifficultyChange: (unitId: number, difficulty: string) => void;
    onNameChange?: (unitId: number, newName: string) => void;
    onUpdateDetails?: (unitId: number, name: string, grade: string) => void;
    onDelete: (unitId: number) => void;
    onErrorChange: (unitId: number, errorType: 'C' | 'M' | 'R' | 'S', delta: number) => void;
    showDeleteButton?: boolean;
    onStatusChange?: (unitId: number, status: 'HIGH' | 'MID' | 'LOW') => void;
    onCompletionStatusChange?: (unitId: number, status: 'incomplete' | 'in-progress' | 'completed') => void;
    isAdmin?: boolean;
    showDifficultySelector?: boolean;
    showStatus?: boolean;
}

export function UnitCard({
    unit,
    onDifficultyChange,
    onNameChange,
    onUpdateDetails,
    onDelete,
    onErrorChange,
    showDeleteButton = true,
    onStatusChange,
    onCompletionStatusChange,
    isAdmin = false,
    showDifficultySelector = true,
    showStatus = true
}: UnitCardProps) {
    const [isEditingName, setIsEditingName] = useState(false);
    const [editedName, setEditedName] = useState(unit.name);
    const [editedGrade, setEditedGrade] = useState(unit.grade || "고1");

    const config = getDifficultyStatusConfig(unit.selectedDifficulty);

    const errorLabels = {
        C: '개념',
        M: '계산',
        R: '독해',
        S: '전략'
    };

    const errorColors = {
        C: { bg: 'bg-blue-500', text: 'text-blue-700', light: 'bg-blue-50' },
        M: { bg: 'bg-red-500', text: 'text-red-700', light: 'bg-red-50' },
        R: { bg: 'bg-orange-500', text: 'text-orange-700', light: 'bg-orange-50' },
        S: { bg: 'bg-purple-500', text: 'text-purple-700', light: 'bg-purple-50' }
    };

    const difficulties = ['상', '중', '하'];

    const handleNameSave = () => {
        if (editedName.trim()) {
            if (onUpdateDetails) {
                onUpdateDetails(unit.id, editedName.trim(), editedGrade);
            } else if (onNameChange) {
                onNameChange(unit.id, editedName.trim());
            }
        }
        setIsEditingName(false);
    };

    const handleNameCancel = () => {
        setEditedName(unit.name);
        setIsEditingName(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleNameSave();
        } else if (e.key === 'Escape') {
            handleNameCancel();
        }
    };

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow relative">
            {/* Delete Button */}
            {showDeleteButton && (
                <button
                    onClick={() => onDelete(unit.id)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors p-1"
                    title="단원 삭제"
                >
                    <Trash2 size={16} />
                </button>
            )}

            {/* Header */}
            <div className="flex items-start justify-between mb-4 pr-10">
                <div className="flex-1">
                    {isEditingName ? (
                        <div className="flex items-center gap-2">
                            <Select value={editedGrade} onValueChange={setEditedGrade}>
                                <SelectTrigger className="w-[80px] h-9">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="중1">중1</SelectItem>
                                    <SelectItem value="중2">중2</SelectItem>
                                    <SelectItem value="중3">중3</SelectItem>
                                    <SelectItem value="고1">고1</SelectItem>
                                    <SelectItem value="고2">고2</SelectItem>
                                    <SelectItem value="고3">고3</SelectItem>
                                </SelectContent>
                            </Select>
                            <input
                                type="text"
                                value={editedName}
                                onChange={(e) => setEditedName(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="flex-1 text-lg font-semibold text-gray-900 border border-blue-400 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                autoFocus
                            />
                            <button onClick={handleNameSave} className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600">
                                <Check size={16} />
                            </button>
                            <button onClick={handleNameCancel} className="p-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400">
                                <X size={16} />
                            </button>
                        </div>
                    ) : (
                        <h4
                            className="text-lg font-semibold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
                            onClick={() => setIsEditingName(true)}
                            title="클릭하여 수정"
                        >
                            {unit.name}
                            <span className="text-gray-500 text-sm ml-2 font-normal">
                                {unit.grade} {unit.subject ? `| ${unit.subject}` : ''}
                            </span>
                        </h4>
                    )}
                    {showStatus && (
                        <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-gray-400">STATUS:</span>
                            <Badge className={config.badgeColor} variant="secondary">
                                {config.status}
                            </Badge>
                        </div>
                    )}
                </div>
            </div>

            {/* Error Types with Counter */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                {Object.entries(unit.errors).map(([type, count]) => {
                    const color = errorColors[type as keyof typeof errorColors];
                    return (
                        <div key={type} className={`${color.light} rounded-lg p-3`}>
                            <div className="flex items-center gap-2 mb-2">
                                <div className={`w-6 h-6 ${color.bg} rounded flex items-center justify-center text-white text-xs font-bold`}>
                                    {type}
                                </div>
                                <span className={`text-sm font-medium ${color.text}`}>
                                    {errorLabels[type as keyof typeof errorLabels]}
                                </span>
                            </div>
                            <div className="flex items-center justify-center gap-3">
                                <button
                                    className="w-7 h-7 bg-white rounded-md flex items-center justify-center hover:bg-gray-100 transition-colors shadow-sm border border-gray-100"
                                    onClick={() => onErrorChange(unit.id, type as 'C' | 'M' | 'R' | 'S', -1)}
                                >
                                    <Minus size={14} className="text-gray-600" />
                                </button>
                                <span className="text-xl font-bold text-gray-900 w-8 text-center">{count}</span>
                                <button
                                    className="w-7 h-7 bg-white rounded-md flex items-center justify-center hover:bg-gray-100 transition-colors shadow-sm border border-gray-100"
                                    onClick={() => onErrorChange(unit.id, type as 'C' | 'M' | 'R' | 'S', 1)}
                                >
                                    <Plus size={14} className="text-gray-600" />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Difficulty Selector */}
            {showDifficultySelector && (
                <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-2">학생 성취도 난이도</p>
                    <div className="flex gap-2">
                        {difficulties.map((diff) => {
                            const diffConfig = getDifficultyStatusConfig(diff);
                            const isSelected = unit.selectedDifficulty === diff;

                            return (
                                <button
                                    key={diff}
                                    onClick={() => onDifficultyChange(unit.id, diff)}
                                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${isSelected
                                        ? `${diffConfig.buttonActive} text-white`
                                        : diffConfig.buttonInactive
                                        }`}
                                >
                                    {diff}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Admin Controls */}
            {isAdmin && (
                <div className="space-y-4 pt-4 border-t border-gray-200">
                    {onStatusChange && (
                        <div>
                            <p className="text-xs text-gray-500 mb-2">단원 난이도 (관리자)</p>
                            <div className="flex gap-2">
                                {(['HIGH', 'MID', 'LOW'] as const).map((status) => {
                                    const statusLabel = status === 'HIGH' ? '상' : status === 'MID' ? '중' : '하';
                                    const isSelected = unit.status === status;
                                    const statusColor =
                                        status === 'HIGH' ? 'bg-red-500 hover:bg-red-600' :
                                            status === 'MID' ? 'bg-blue-500 hover:bg-blue-600' :
                                                'bg-yellow-500 hover:bg-yellow-600';

                                    return (
                                        <button
                                            key={status}
                                            onClick={() => onStatusChange(unit.id, status)}
                                            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${isSelected ? `${statusColor} text-white` : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                                }`}
                                        >
                                            {statusLabel}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {onCompletionStatusChange && (
                        <div>
                            <p className="text-xs text-gray-500 mb-2">학습 완료 상태</p>
                            <div className="flex gap-2">
                                {([
                                    { value: 'incomplete', label: '미완료', color: 'bg-gray-400 hover:bg-gray-500' },
                                    { value: 'in-progress', label: '진행 중', color: 'bg-orange-400 hover:bg-orange-500' },
                                    { value: 'completed', label: '완료', color: 'bg-green-500 hover:bg-green-600' }
                                ] as const).map((option) => {
                                    const isSelected = unit.completionStatus === option.value;
                                    return (
                                        <button
                                            key={option.value}
                                            onClick={() => onCompletionStatusChange(unit.id, option.value)}
                                            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${isSelected ? `${option.color} text-white` : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                                }`}
                                        >
                                            {option.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
