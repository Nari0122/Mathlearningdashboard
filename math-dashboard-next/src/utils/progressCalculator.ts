/**
 * 학습 진행률 계산 유틸리티
 * 관리자와 학생 페이지에서 동일한 계산 로직을 사용하도록 함
 */

interface Unit {
  completionStatus?: 'incomplete' | 'in-progress' | 'completed';
}

/**
 * 단원 완료 상태를 기반으로 학습 진행률을 계산합니다.
 * @param units 단원 배열
 * @returns 진행률 (0-100)
 */
export function calculateProgress(units: Unit[]): number {
  if (!units || units.length === 0) {
    return 0;
  }

  const completedUnits = units.filter(unit => unit.completionStatus === 'completed').length;
  const progress = Math.round((completedUnits / units.length) * 100);
  
  return progress;
}

/**
 * 진행률을 기반으로 학습 상태를 반환합니다.
 * @param progress 진행률 (0-100)
 * @returns 학습 상태 문자열
 */
export function getProgressStatus(progress: number): string {
  if (progress === 0) return '시작 전';
  if (progress < 30) return '초기 단계';
  if (progress < 60) return '보통';
  if (progress < 90) return '양호';
  if (progress < 100) return '우수';
  return '완료';
}
