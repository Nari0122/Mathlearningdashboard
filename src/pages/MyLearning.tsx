import { BookOpen, Filter } from 'lucide-react';
import { useState } from 'react';
import { UnitCard } from '../components/UnitCard';

interface MyLearningProps {
  units: Array<{
    id: number;
    name: string;
    status: 'HIGH' | 'MID' | 'LOW';
    errors: {
      C: number;
      M: number;
      R: number;
      S: number;
    };
    selectedDifficulty: string;
    completionStatus?: 'incomplete' | 'in-progress' | 'completed';
  }>;
  onDifficultyChange: (unitId: number, difficulty: string) => void;
  onNameChange: (unitId: number, newName: string) => void;
  onDelete: (unitId: number) => void;
  onErrorChange: (unitId: number, errorType: 'C' | 'M' | 'R' | 'S', delta: number) => void;
}

type FilterType = 'all' | 'incomplete' | 'in-progress' | 'completed';

export function MyLearning({
  units,
  onDifficultyChange,
  onNameChange,
  onDelete,
  onErrorChange
}: MyLearningProps) {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  // 필터링된 단원
  const filteredUnits = units.filter(unit => {
    if (activeFilter === 'all') return true;
    return unit.completionStatus === activeFilter;
  });

  // 통계
  const completedCount = units.filter(u => u.completionStatus === 'completed').length;
  const inProgressCount = units.filter(u => u.completionStatus === 'in-progress').length;
  const incompleteCount = units.filter(u => u.completionStatus === 'incomplete').length;

  const filters: { type: FilterType; label: string; count: number; color: string }[] = [
    { type: 'all', label: '전체', count: units.length, color: 'bg-indigo-500' },
    { type: 'in-progress', label: '진행 중', count: inProgressCount, color: 'bg-orange-500' },
    { type: 'incomplete', label: '미완료', count: incompleteCount, color: 'bg-gray-500' },
    { type: 'completed', label: '완료', count: completedCount, color: 'bg-green-500' }
  ];

  return (
    <div className="max-w-[1440px] mx-auto p-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <BookOpen size={32} className="text-indigo-600" />
          <h1 className="text-3xl font-bold text-gray-900">내 학습</h1>
        </div>
        <p className="text-gray-600">전체 단원 목록과 학습 상태를 확인할 수 있습니다.</p>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-2xl shadow-sm p-4 mb-6">
        <div className="flex items-center gap-2">
          <Filter size={20} className="text-gray-500" />
          <div className="flex gap-2 flex-1">
            {filters.map((filter) => {
              const isActive = activeFilter === filter.type;
              return (
                <button
                  key={filter.type}
                  onClick={() => setActiveFilter(filter.type)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    isActive
                      ? `${filter.color} text-white shadow-md`
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <span>{filter.label}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    isActive
                      ? 'bg-white bg-opacity-30 text-gray-900'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {filter.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Units Grid */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {activeFilter === 'all' && '전체 단원'}
            {activeFilter === 'in-progress' && '진행 중인 단원'}
            {activeFilter === 'incomplete' && '미완료 단원'}
            {activeFilter === 'completed' && '완료한 단원'}
            {' '}
            <span className="text-indigo-600">({filteredUnits.length})</span>
          </h2>
        </div>

        {filteredUnits.length > 0 ? (
          <div className="grid grid-cols-3 gap-4">
            {filteredUnits.map((unit) => (
              <UnitCard 
                key={unit.id} 
                unit={unit}
                onDifficultyChange={onDifficultyChange}
                onNameChange={onNameChange}
                onDelete={onDelete}
                onErrorChange={onErrorChange}
                showDeleteButton={false}
                isAdmin={false}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">
              {activeFilter === 'all' && '등록된 단원이 없습니다.'}
              {activeFilter === 'in-progress' && '진행 중인 단원이 없습니다.'}
              {activeFilter === 'incomplete' && '미완료 단원이 없습니다.'}
              {activeFilter === 'completed' && '완료한 단원이 없습니다.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}