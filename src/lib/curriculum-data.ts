/**
 * 수학 교육 커리큘럼 고정 데이터 구조
 * 
 * 계층: 학제 → 학년 → 영역/과목 → 단원 → (고등만) 세부내용
 * 
 * 중요:
 * - 중등: 세부내용 없음 (단원에서 계층 종료)
 * - 고등: 세부내용 필수
 */

export type SchoolLevel = '중등' | '고등';

export const SCHOOL_LEVELS: SchoolLevel[] = ['중등', '고등'];

export const GRADES: Record<SchoolLevel, string[]> = {
    '중등': ['중1', '중2', '중3'],
    '고등': ['고1', '고2', '고3']
};

// 중등: 영역, 고등: 과목
export const SUBJECTS: Record<SchoolLevel, Record<string, string[]>> = {
    '중등': {
        '중1': ['수와 연산', '변화와 관계', '도형과 측정', '자료와 가능성'],
        '중2': ['수와 연산', '변화와 관계', '도형과 측정', '자료와 가능성'],
        '중3': ['수와 연산', '변화와 관계', '도형과 측정', '자료와 가능성']
    },
    '고등': {
        '고1': ['공통수학1', '공통수학2'],
        '고2': ['대수', '미적분 I', '확률과 통계'],
        '고3': ['미적분 II', '기하']
    }
};

// 단원 구조: 중등은 details 없음, 고등은 details 있음
type UnitStructure = { unit: string; details: string[] };

/**
 * 전체 커리큘럼 데이터
 * 
 * 중등: details는 항상 빈 배열
 * 고등: details에 세부내용 포함
 */
export const CURRICULUM_DATA: Record<string, Record<string, UnitStructure[]>> = {
    // ========== 중등 (세부내용 없음) ==========
    '수와 연산': {
        '중1': [
            { unit: '소인수분해', details: [] },
            { unit: '정수와 유리수', details: [] }
        ],
        '중2': [
            { unit: '유리수와 순환소수', details: [] }
        ],
        '중3': [
            { unit: '제곱근과 실수', details: [] }
        ]
    },
    '변화와 관계': {
        '중1': [
            { unit: '문자의 사용과 식', details: [] },
            { unit: '일차방정식', details: [] },
            { unit: '좌표평면과 그래프', details: [] }
        ],
        '중2': [
            { unit: '식의 계산', details: [] },
            { unit: '일차부등식', details: [] },
            { unit: '연립일차방정식', details: [] },
            { unit: '일차함수와 그 그래프', details: [] },
            { unit: '일차함수와 일차방정식의 관계', details: [] }
        ],
        '중3': [
            { unit: '다항식의 곱셈과 인수분해', details: [] },
            { unit: '이차방정식', details: [] },
            { unit: '이차함수와 그 그래프', details: [] }
        ]
    },
    '도형과 측정': {
        '중1': [
            { unit: '기본 도형', details: [] },
            { unit: '작도와 합동', details: [] },
            { unit: '평면도형의 성질', details: [] },
            { unit: '입체도형의 성질', details: [] }
        ],
        '중2': [
            { unit: '삼각형과 사각형의 성질', details: [] },
            { unit: '도형의 닮음', details: [] },
            { unit: '피타고라스 정리', details: [] }
        ],
        '중3': [
            { unit: '삼각비', details: [] },
            { unit: '원의 성질', details: [] }
        ]
    },
    '자료와 가능성': {
        '중1': [
            { unit: '대표값', details: [] },
            { unit: '도수분포표와 상대도수', details: [] }
        ],
        '중2': [
            { unit: '경우의 수와 확률', details: [] }
        ],
        '중3': [
            { unit: '산포도', details: [] },
            { unit: '상자그림과 산점도', details: [] }
        ]
    },

    // ========== 고등 (세부내용 포함) ==========
    '공통수학1': {
        '고1': [
            {
                unit: '다항식',
                details: ['다항식의 연산', '나머지정리', '인수분해']
            },
            {
                unit: '방정식과 부등식',
                details: ['복소수와 이차방정식', '이차방정식과 이차함수', '여러 가지 방정식과 부등식']
            },
            {
                unit: '경우의 수',
                details: ['합의 법칙과 곱의 법칙', '순열과 조합']
            },
            {
                unit: '행렬',
                details: ['행렬과 그 연산']
            }
        ]
    },
    '공통수학2': {
        '고1': [
            {
                unit: '도형의 방정식',
                details: ['평면좌표', '직선의 방정식', '원의 방정식', '도형의 이동']
            },
            {
                unit: '집합과 명제',
                details: ['집합', '명제']
            },
            {
                unit: '함수와 그래프',
                details: ['함수', '유리함수와 무리함수']
            }
        ]
    },
    '대수': {
        '고2': [
            {
                unit: '지수함수와 로그함수',
                details: ['지수와 로그', '지수함수와 로그함수']
            },
            {
                unit: '삼각함수',
                details: ['삼각함수', '사인법칙과 코사인법칙']
            },
            {
                unit: '수열',
                details: ['등차수열과 등비수열', '수열의 합', '수학적 귀납법']
            }
        ]
    },
    '미적분 I': {
        '고2': [
            {
                unit: '함수의 극한과 연속',
                details: ['함수의 극한', '함수의 연속']
            },
            {
                unit: '미분',
                details: ['미분계수', '도함수', '도함수의 활용']
            },
            {
                unit: '적분',
                details: ['부정적분', '정적분', '정적분의 활용']
            }
        ]
    },
    '확률과 통계': {
        '고2': [
            {
                unit: '경우의 수',
                details: ['순열과 조합', '이항정리']
            },
            {
                unit: '확률',
                details: ['확률의 개념과 활용', '조건부확률']
            },
            {
                unit: '통계',
                details: ['확률분포', '통계적 추정']
            }
        ]
    },
    '미적분 II': {
        '고3': [
            {
                unit: '수열의 극한',
                details: ['수열의 극한', '급수']
            },
            {
                unit: '미분법',
                details: ['여러 가지 함수의 미분', '여러 가지 미분법', '도함수의 활용']
            },
            {
                unit: '적분법',
                details: ['여러 가지 함수의 적분법', '정적분의 활용']
            }
        ]
    },
    '기하': {
        '고3': [
            {
                unit: '이차곡선',
                details: ['이차곡선']
            },
            {
                unit: '공간도형과 공간좌표',
                details: ['공간도형', '공간좌표']
            },
            {
                unit: '벡터',
                details: ['벡터의 연산', '벡터의 성분과 내적', '도형의 방정식']
            }
        ]
    }
};

/**
 * 학제가 중등인지 고등인지 확인
 */
export const isMiddleSchool = (schoolLevel: string): boolean => {
    return schoolLevel === '중등';
};

export const isHighSchool = (schoolLevel: string): boolean => {
    return schoolLevel === '고등';
};

/**
 * 특정 과목/영역 + 학년에 해당하는 단원 목록 반환
 */
export const getUnits = (subject: string, grade?: string): UnitStructure[] => {
    const subjectData = CURRICULUM_DATA[subject];
    if (!subjectData) return [];

    if (grade && subjectData[grade]) {
        return subjectData[grade];
    }

    // 학년이 지정되지 않으면 모든 학년의 단원 반환
    return Object.values(subjectData).flat();
};

/**
 * 특정 단원의 세부내용 반환
 * 중등인 경우 빈 배열 반환
 */
export const getDetails = (subject: string, grade: string, unitName: string): string[] => {
    const units = getUnits(subject, grade);
    const found = units.find(u => u.unit === unitName);
    return found?.details || [];
};
