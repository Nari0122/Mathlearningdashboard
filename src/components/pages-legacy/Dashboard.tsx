import { OverallProgress } from '../components/OverallProgress';
import { AchievementDistribution } from '../components/AchievementDistribution';
import { TotalErrorAnalysis } from '../components/TotalErrorAnalysis';
import { UnitCard } from '../components/UnitCard';
import { GuideCard } from '../components/GuideCard';
import { Plus, BookOpen } from 'lucide-react';

interface DashboardProps {
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
  onAddUnit: () => void;
  onStatusChange?: (unitId: number, status: 'HIGH' | 'MID' | 'LOW') => void;
  onCompletionStatusChange?: (unitId: number, status: 'incomplete' | 'in-progress' | 'completed') => void;
  isAdmin?: boolean;
  showAddButton?: boolean; // 단원 추가 버튼 표시 여부
}

export function Dashboard({
  units,
  onDifficultyChange,
  onNameChange,
  onDelete,
  onErrorChange,
  onAddUnit,
  onStatusChange,
  onCompletionStatusChange,
  isAdmin = true,
  showAddButton = true
}: DashboardProps) {
  return (
    <div className="max-w-[1440px] mx-auto p-8">
      {/* Top 3 Cards - Full Width */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <OverallProgress units={units} />
        <AchievementDistribution units={units} />
        <TotalErrorAnalysis units={units} />
      </div>

      {/* Bottom Section - Unit List + Guide Card */}
      <div className="flex gap-6">
        {/* Unit Analysis Section */}
        <div className="flex-1">
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">단원별 정밀 분석 리스트</h2>
              {showAddButton && (
                <button 
                  onClick={onAddUnit}
                  className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <Plus size={18} />
                  <span className="font-medium">단원 추가</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {units.length === 0 ? (
                <div className="col-span-2 flex flex-col items-center justify-center py-16">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <BookOpen size={40} className="text-gray-400" />
                  </div>
                  <p className="text-lg font-medium text-gray-700 mb-2">아직 학습 데이터가 없습니다</p>
                  <p className="text-sm text-gray-500 mb-6 text-center max-w-md">
                    {isAdmin 
                      ? '단원을 추가하거나 학습을 시작하면 이곳에 표시됩니다.'
                      : '학습을 시작하면 이곳에 단원별 분석 결과가 표시됩니다.'}
                  </p>
                  {showAddButton && (
                    <button 
                      onClick={onAddUnit}
                      className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
                    >
                      <Plus size={18} />
                      <span className="font-medium">첫 단원 추가하기</span>
                    </button>
                  )}
                </div>
              ) : (
                units.map((unit) => (
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
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Guide Card */}
        <div className="w-80">
          <GuideCard units={units} />
        </div>
      </div>
    </div>
  );
}