import { User, LogOut, BookOpen } from 'lucide-react';
import { OverallProgress } from '../components/OverallProgress';
import { AchievementDistribution } from '../components/AchievementDistribution';
import { TotalErrorAnalysis } from '../components/TotalErrorAnalysis';
import { UnitCard } from '../components/UnitCard';
import { GuideCard } from '../components/GuideCard';

interface StudentDashboardProps {
  studentName: string;
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
  onLogout: () => void;
  onNavigateToLearningHistory?: () => void;
  onNavigateToMyLearning?: () => void;
  onNavigateToClassSchedule?: () => void;
  onNavigateToHomework?: () => void;
  onNavigateToExamRecords?: () => void;
  learningRecordsCount?: number;
}

export function StudentDashboard({
  studentName,
  units,
  onDifficultyChange,
  onNameChange,
  onDelete,
  onErrorChange,
  onLogout,
  onNavigateToLearningHistory,
  onNavigateToMyLearning,
  onNavigateToClassSchedule,
  onNavigateToHomework,
  onNavigateToExamRecords,
  learningRecordsCount = 0
}: StudentDashboardProps) {
  // 완료 상태 기반 통계
  const completedUnits = units.filter(u => u.completionStatus === 'completed').length;
  const totalUnits = units.length;
  
  // 진행 중 + 미완료 단원만 필터링 (완료 단원 숨김)
  const activeUnits = units.filter(u => u.completionStatus !== 'completed');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Dashboard Content */}
      <div className="max-w-[1440px] mx-auto p-8">
        {/* Top 3 Cards - Full Width */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <OverallProgress units={units} />
          <AchievementDistribution units={units} />
          <TotalErrorAnalysis units={units} />
        </div>

        {/* Learning Progress & Records Card */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          {/* Unit Completion Progress - Clickable */}
          {onNavigateToMyLearning && (
            <button
              onClick={onNavigateToMyLearning}
              className="bg-white border-2 border-gray-200 rounded-2xl shadow-sm p-6 hover:border-gray-300 hover:shadow transition-all text-left"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">학습 완료 현황</h3>
                  <p className="text-gray-500 text-sm">클릭하여 전체 단원 보기</p>
                </div>
                <BookOpen size={28} className="text-gray-400" />
              </div>
              <div className="flex items-end justify-between mb-4">
                <div>
                  <p className="text-5xl font-bold text-gray-900 mb-2">{completedUnits}</p>
                  <p className="text-gray-600">/ {totalUnits}개 단원 완료</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-gray-900">
                    {totalUnits > 0 ? Math.round((completedUnits / totalUnits) * 100) : 0}%
                  </p>
                  <p className="text-sm text-gray-500">완료율</p>
                </div>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gray-900 transition-all duration-500"
                  style={{ width: `${totalUnits > 0 ? (completedUnits / totalUnits) * 100 : 0}%` }}
                />
              </div>
            </button>
          )}

          {/* Learning Records Card */}
          {onNavigateToLearningHistory && (
            <button
              onClick={onNavigateToLearningHistory}
              className="bg-white border-2 border-gray-200 rounded-2xl shadow-sm p-6 hover:border-gray-300 hover:shadow transition-all text-left"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">학습 기록</h3>
                  <p className="text-gray-500 text-sm">선생님이 작성한 학습 일지</p>
                </div>
                <BookOpen size={32} className="text-gray-400" />
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-5xl font-bold text-gray-900">{learningRecordsCount}</p>
                  <p className="text-gray-600 mt-1">개의 기록</p>
                </div>
                <div className="text-sm text-gray-500">
                  클릭하여 확인 →
                </div>
              </div>
            </button>
          )}
        </div>

        {/* Bottom Section - Unit List + Guide Card */}
        <div className="flex gap-6">
          {/* Unit Analysis Section - Show only active units (진행중 + 미완료) */}
          <div className="flex-1">
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">내 단원 학습 현황</h2>
                <div className="bg-gray-100 px-4 py-2 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-900">
                    <span className="font-semibold">{activeUnits.length}</span>개 단원 진행 중
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {activeUnits.map((unit) => (
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

              {activeUnits.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">진행 중인 단원이 없습니다.</p>
                  <p className="text-sm text-gray-400 mt-2">모든 단원을 완료했거나 아직 시작하지 않았습니다.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Guide Card */}
          <div className="w-80">
            <GuideCard units={units} />
          </div>
        </div>
      </div>
    </div>
  );
}