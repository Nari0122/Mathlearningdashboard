import { FolderTree, Search, Plus } from 'lucide-react';
import { UnitCard } from '../components/UnitCard';
import { AddUnitModal } from '../components/AddUnitModal';
import { useState } from 'react';

interface UnitManagementProps {
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
  onAddUnit: (unitName?: string) => void;
  onStatusChange?: (unitId: number, status: 'HIGH' | 'MID' | 'LOW') => void;
  onCompletionStatusChange?: (unitId: number, status: 'incomplete' | 'in-progress' | 'completed') => void;
  isAdmin?: boolean;
}

export function UnitManagement({
  units,
  onDifficultyChange,
  onNameChange,
  onDelete,
  onErrorChange,
  onAddUnit,
  onStatusChange,
  onCompletionStatusChange,
  isAdmin = true
}: UnitManagementProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // 검색 필터링
  const filteredUnits = units.filter(unit => 
    unit.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddUnit = (unitName: string) => {
    // onAddUnit을 통해 새 단원 추가
    onAddUnit(unitName);
  };

  return (
    <div className="max-w-[1440px] mx-auto p-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <FolderTree size={32} className="text-indigo-600" />
          <h1 className="text-3xl font-bold text-gray-900">단원 관리</h1>
        </div>
        <p className="text-gray-600">수학 단원을 추가하고 관리할 수 있습니다.</p>
      </div>

      {/* Actions Bar */}
      <div className="bg-white rounded-2xl shadow-sm p-4 mb-6 flex items-center gap-4">
        <div className="flex-1 relative">
          <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="단원 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus size={18} />
          <span className="font-medium">단원 추가</span>
        </button>
      </div>

      {/* Units Grid */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {searchQuery ? `검색 결과 (${filteredUnits.length})` : `전체 단원 (${units.length})`}
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
                onStatusChange={onStatusChange}
                onCompletionStatusChange={onCompletionStatusChange}
                isAdmin={isAdmin}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FolderTree size={48} className="mx-auto text-gray-300 mb-4" />
            {searchQuery ? (
              <>
                <p className="text-gray-500 mb-2">"{searchQuery}"에 대한 검색 결과가 없습니다.</p>
                <button 
                  onClick={() => setSearchQuery('')}
                  className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                >
                  검색어 초기화
                </button>
              </>
            ) : (
              <>
                <p className="text-lg font-medium text-gray-700 mb-2">등록된 단원이 없습니다</p>
                <p className="text-sm text-gray-500 mb-4">
                  {isAdmin 
                    ? '단원을 추가하여 학습 관리를 시작하세요.' 
                    : '학습을 시작하면 단원이 표시됩니다.'}
                </p>
                {isAdmin && (
                  <button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="mt-4 px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    첫 단원 추가하기
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <AddUnitModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddUnit}
      />
    </div>
  );
}