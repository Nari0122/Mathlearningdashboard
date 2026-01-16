interface TotalErrorAnalysisProps {
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
  }>;
}

export function TotalErrorAnalysis({ units }: TotalErrorAnalysisProps) {
  // 모든 단원의 오류를 합산
  const totalErrors = units.reduce(
    (acc, unit) => ({
      C: acc.C + unit.errors.C,
      M: acc.M + unit.errors.M,
      R: acc.R + unit.errors.R,
      S: acc.S + unit.errors.S
    }),
    { C: 0, M: 0, R: 0, S: 0 }
  );

  // 최대값 계산 (바 차트의 너비 비율용)
  const maxCount = Math.max(totalErrors.C, totalErrors.M, totalErrors.R, totalErrors.S, 1);

  const errors = [
    { 
      label: 'C', 
      name: '개념(C)', 
      count: totalErrors.C, 
      color: 'bg-blue-500', 
      width: `${(totalErrors.C / maxCount) * 100}%` 
    },
    { 
      label: 'M', 
      name: '계산(M)', 
      count: totalErrors.M, 
      color: 'bg-red-500', 
      width: `${(totalErrors.M / maxCount) * 100}%` 
    },
    { 
      label: 'R', 
      name: '독해(R)', 
      count: totalErrors.R, 
      color: 'bg-orange-500', 
      width: `${(totalErrors.R / maxCount) * 100}%` 
    },
    { 
      label: 'S', 
      name: '전략(S)', 
      count: totalErrors.S, 
      color: 'bg-purple-500', 
      width: `${(totalErrors.S / maxCount) * 100}%` 
    }
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col">
      <h3 className="text-sm text-gray-500 uppercase tracking-wider mb-4 font-bold">Total Error Analysis</h3>
      
      <div className="space-y-3 flex-1 flex flex-col justify-center">
        {errors.map((error) => (
          <div key={error.label} className="flex items-center gap-3">
            <div className="w-16 text-sm text-gray-600">{error.name}</div>
            <div className="flex-1 bg-gray-100 rounded-full h-2.5">
              <div
                className={`${error.color} h-2.5 rounded-full transition-all duration-300`}
                style={{ width: error.width }}
              />
            </div>
            <div className="w-6 text-right text-sm font-semibold text-gray-900">{error.count}</div>
          </div>
        ))}
      </div>
    </div>
  );
}