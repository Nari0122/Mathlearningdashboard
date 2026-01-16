import { BarChart3, FileText } from 'lucide-react';

interface StatsReportProps {
  units: Array<{
    id: number;
    name: string;
    status: string;
    errors: {
      C: number;
      M: number;
      R: number;
      S: number;
    };
    selectedDifficulty: string;
    completionStatus?: 'incomplete' | 'in-progress' | 'completed';
  }>;
}

export function StatsReport({ units }: StatsReportProps) {
  const totalErrors = units.reduce((sum, u) => sum + u.errors.C + u.errors.M + u.errors.R + u.errors.S, 0);
  const avgErrors = units.length > 0 ? (totalErrors / units.length).toFixed(1) : '0';
  
  // 완료 상태 기반 통계
  const completedUnits = units.filter(u => u.completionStatus === 'completed').length;
  const inProgressUnits = units.filter(u => u.completionStatus === 'in-progress').length;
  const incompleteUnits = units.filter(u => u.completionStatus === 'incomplete').length;
  const completionRate = units.length > 0 ? ((completedUnits / units.length) * 100).toFixed(1) : '0';

  return (
    <div className="max-w-[1440px] mx-auto p-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <BarChart3 size={32} className="text-green-600" />
          <h1 className="text-3xl font-bold text-gray-900">통계 리포트</h1>
        </div>
        <p className="text-gray-600">전체 학습 통계 및 진도 현황을 확인할 수 있습니다.</p>
      </div>

      {units.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-16">
          <div className="text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText size={40} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">통계 데이터가 없습니다</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              학습 단원을 추가하고 데이터를 입력하면 이곳에 통계 리포트가 표시됩니다.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Stats Overview */}
          <div className="grid grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-sm p-6 text-white">
              <p className="text-blue-100 mb-2">전체 단원</p>
              <p className="text-4xl font-bold mb-1">{units.length}</p>
              <p className="text-sm text-blue-100">개 단원</p>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-sm p-6 text-white">
              <p className="text-green-100 mb-2">완료율</p>
              <p className="text-4xl font-bold mb-1">{completionRate}%</p>
              <p className="text-sm text-green-100">{completedUnits}개 완료</p>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-sm p-6 text-white">
              <p className="text-orange-100 mb-2">진행 중</p>
              <p className="text-4xl font-bold mb-1">{inProgressUnits}</p>
              <p className="text-sm text-orange-100">개 단원</p>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-sm p-6 text-white">
              <p className="text-purple-100 mb-2">평균 오답</p>
              <p className="text-4xl font-bold mb-1">{avgErrors}</p>
              <p className="text-sm text-purple-100">개/단원</p>
            </div>
          </div>

          {/* Detailed Stats Table */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">단원별 상세 통계</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">단원명</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">완료 상태</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">단원 난이도</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">학생 성취도</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">개념(C)</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">계산(M)</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">독해(R)</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">전략(S)</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">총 오답</th>
                  </tr>
                </thead>
                <tbody>
                  {units.map((unit) => {
                    const total = unit.errors.C + unit.errors.M + unit.errors.R + unit.errors.S;
                    
                    // 완료 상태
                    const completionStatusColor = 
                      unit.completionStatus === 'completed' ? 'bg-green-100 text-green-700' :
                      unit.completionStatus === 'in-progress' ? 'bg-orange-100 text-orange-700' :
                      'bg-gray-100 text-gray-700';
                    
                    const completionStatusLabel = 
                      unit.completionStatus === 'completed' ? '완료' :
                      unit.completionStatus === 'in-progress' ? '진행 중' : '미완료';
                    
                    // 단원 난이도 (status)
                    const statusColor = 
                      unit.status === 'HIGH' ? 'bg-red-100 text-red-700' :
                      unit.status === 'MID' ? 'bg-blue-100 text-blue-700' :
                      'bg-yellow-100 text-yellow-700';
                    
                    const statusLabel = 
                      unit.status === 'HIGH' ? '상' :
                      unit.status === 'MID' ? '중' : '하';
                    
                    // 학생 성취도 (selectedDifficulty)
                    const achievementColor = 
                      unit.selectedDifficulty === '상' ? 'bg-red-100 text-red-700' :
                      unit.selectedDifficulty === '중' ? 'bg-blue-100 text-blue-700' :
                      'bg-yellow-100 text-yellow-700';

                    return (
                      <tr key={unit.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm text-gray-900">{unit.name}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${completionStatusColor}`}>
                            {completionStatusLabel}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${statusColor}`}>
                            {statusLabel}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${achievementColor}`}>
                            {unit.selectedDifficulty}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center text-sm text-gray-700">{unit.errors.C}</td>
                        <td className="py-3 px-4 text-center text-sm text-gray-700">{unit.errors.M}</td>
                        <td className="py-3 px-4 text-center text-sm text-gray-700">{unit.errors.R}</td>
                        <td className="py-3 px-4 text-center text-sm text-gray-700">{unit.errors.S}</td>
                        <td className="py-3 px-4 text-center text-sm font-semibold text-gray-900">{total}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {units.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  데이터가 없습니다.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}