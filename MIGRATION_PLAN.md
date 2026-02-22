# 수학 학습 대시보드 통합 마이그레이션 계획

## 원칙
- **현재(Vite)에서 작동하는 동작은 마이그레이션 후(Next 단일 프로젝트)에도 동일하게 작동해야 함.**
- 기준 코드베이스: **math-dashboard-next** (Next.js)
- 흡수 대상: **Mathlearningdashboard-main** (Vite)의 화면·플로우·데이터 구조

---

## 1. 현재 상태 정리

### 1.1 Vite (Mathlearningdashboard-main) – “지금 작동하는 것” 기준
- **인증**: 메모리 mock. 계정 `admin`/`admin123`, `student1`/`pass123`, `student2`/`pass123`. AuthContext.
- **관리자 플로우**: 로그인 → 학생 관리(목록) → 학생 선택 → 학생 상세(탭: 대시보드, 단원 진행 현황, 오답 분석, 통계 리포트, 학습 기록, 수업 일정, 숙제, 시험 기록) / 계정 관리 버튼 → 학생 정보·비밀번호 수정.
- **학생 플로우**: 로그인 → 학생 대시보드(진도, 단원 카드, 학습 기록 개수 등) → 서브: 학습 기록, 내 학습, 수업 일정, 숙제, 시험 기록.
- **데이터**: 전부 App.tsx state (studentData, students). Firebase/서버 없음. 학생별 units, learningRecords, classSessions, homework, examRecords, regularSchedule.

### 1.2 Next (math-dashboard-next) – 현재 구조
- **인증**: 로그인 페이지는 `auth-actions`의 `loginAction` 호출 → **auth-actions 파일 없음** → 로그인 실패.
- **데이터**: Firebase (studentService, learningService 등). DB 없으면 빈 화면/에러.
- **라우트**: `/admin/students`, `/admin/students/[id]`(대시보드, learning, analysis, report, history, schedule, homework, exams, incorrect-notes), `/(dashboard)/*`, `/(student)/student/[id]/*`, `/parent/*`.
- **보호**: 세션/미들웨어 없음. 로그인 없이 URL만으로 접근 가능.

---

## 2. 목표 동작 (마이그레이션 후)

| 구분 | 동작 |
|------|------|
| 로그인 | admin / admin123 → 관리자. student1 / pass123, student2 / pass123 → 학생. (Vite와 동일 계정) |
| 관리자 | 로그인 후 `/admin/students` → 학생 목록 → 학생 클릭 → `/admin/students/[id]` 탭 네비게이션으로 대시보드·단원·오답·통계·학습기록·일정·숙제·시험·(계정관리) |
| 학생 | 로그인 후 해당 학생 전용 대시보드(진도, 단원, 학습기록 수 등) 및 학습 기록/내 학습/일정/숙제/시험 기록 화면 |
| 데이터 | Firebase 사용 가능 시 Firestore 사용. 미사용/빈 DB 시 **Mock 데이터 폴백**으로 Vite와 동일한 체감 동작 유지 |

---

## 3. 작업 단계 (상세)

### Phase 1: 인증 복구 및 동일 동작
1. **auth-actions.ts 생성**
   - `loginAction(loginId, password)`: Vite와 동일 mock 사용자 검증 (admin, student1, student2).
   - 성공 시 세션 쿠키 설정 (userId, role, loginId, studentId(학생일 때)).
   - 반환: `{ success, redirectUrl?, message? }`. admin → `/admin/students`, student → `/student/[id]` (loginId→studentId 매핑).
2. **세션 유틸**
   - 쿠키 읽기/쓰기 (암호화 또는 서명). `getSession()`, `setSession()`, `clearSession()`.
3. **미들웨어**
   - `/admin/*`, `/dashboard/*`, `/student/*` 접근 시 세션 검사. 없으면 `/login` 리다이렉트.
   - `/login`은 비로그인만 허용.

### Phase 2: Mock 데이터 폴백 (동일 동작 보장)
4. **Mock 데이터**
   - Vite의 `students`, `studentData` (id 1 김민수, id 5 강나리 등)와 동일한 구조의 mock 상수 또는 JSON.
5. **서비스 레이어 폴백**
   - `studentService.getStudents()`, `getStudentDetail(id)` 등에서 Firebase 오류 또는 빈 결과 시 mock 반환.
   - 학습 기록/일정/숙제/시험 등도 Firebase 없을 때 mock 반환하도록 learningService 등에 폴백.

### Phase 3: 화면/플로우 정합성
6. **관리자 학생 상세 탭**
   - Next는 이미 URL 기반 탭 (learning, analysis, report, history, schedule, homework, exams, incorrect-notes). Vite와 라벨/순서만 맞추기.
7. **학생 진입점**
   - 로그인 후 redirectUrl이 `/student/[id]`가 되도록 하고, (student) 레이아웃에서 세션의 studentId 사용. 기존 `getFirstStudent()` 대신 “현재 로그인한 학생” 기준으로 데이터 조회.
8. **(dashboard) vs (student)**
   - Vite는 학생이 “한 레이아웃 안에서 탭 전환”. Next는 (dashboard)와 (student)/student/[id]가 혼재할 수 있음. 학생은 `/student/[id]` 하나로 통일하고, 대시보드는 `/student/[id]`가 메인, 서브가 history, homework 등으로 일치시키기.

### Phase 4: 정리 및 검증
9. **Vite 프로젝트**
   - 통합 완료·검증 후 README에 “실제 앱은 math-dashboard-next 단일 프로젝트로 이전됨” 명시. 필요 시 폴더명에 `_archived` 등 표시.
10. **검증 체크리스트**
    - [ ] admin 로그인 → 학생 목록 → 학생 선택 → 모든 탭 이동·데이터 표시
    - [ ] student1 로그인 → 강나리 대시보드·학습기록·일정·숙제·시험
    - [ ] student2 로그인 → 김민수 대시보드 동일
    - [ ] Firebase 없이 실행 시 Mock으로 동일하게 동작
    - [ ] 로그아웃 후 /admin, /student 직접 접근 시 /login으로 리다이렉트

---

## 4. 파일 변경 요약

| 작업 | 파일/위치 |
|------|------------|
| 신규 | `src/actions/auth-actions.ts` (loginAction, getSession, logout) |
| 신규 | `src/lib/session.ts` (쿠키 기반 세션 유틸) |
| 신규 | `src/lib/mock-data.ts` (Vite와 동일한 students, studentData) |
| 수정 | `src/app/(auth)/login/page.tsx` (이미 loginAction 사용 중 – auth-actions만 추가하면 됨) |
| 신규 | `middleware.ts` (라우트 보호) |
| 수정 | `src/services/studentService.ts` (Firebase 실패/빈 값 시 mock 폴백) |
| 수정 | `src/app/(dashboard)/layout.tsx`, `page.tsx` (세션에서 현재 학생 조회) |
| 수정 | `src/app/(student)/layout.tsx` (세션 기반 학생 확인) |
| 필요 시 | learningService 등에도 mock 폴백 추가 |

---

## 5. 진행 순서
1. Phase 1 완료 → 로그인 및 역할별 리다이렉트·라우트 보호 동작 확인.
2. Phase 2 완료 → Firebase 없이 Mock으로 전체 플로우 확인.
3. Phase 3로 화면/URL 정합성 맞춤.
4. Phase 4로 Vite 정리 및 최종 체크리스트 수행.

---

## 6. 완료된 작업 (최초 마이그레이션)

- **auth-actions.ts** 생성: Vite와 동일 mock 계정(admin/admin123, student1/pass123, student2/pass123)으로 로그인, 세션 쿠키 설정, 역할별 redirectUrl 반환.
- **session.ts**: encodeSession/decodeSession(서버), decodeSessionEdge(미들웨어용).
- **middleware.ts**: /admin, /dashboard, /student 비로그인 시 /login 리다이렉트; 로그인 후 /login 접근 시 역할별 홈으로 리다이렉트.
- **mock-data.ts**: Vite와 동일한 학생 목록·학생별 단원 데이터. getMockStudents(), getMockStudentDetail(id).
- **studentService**: getStudents/getFirstStudent/getStudentDetail에서 Firebase 빈 결과 또는 예외 시 mock 폴백.
- **(student)/student/[id]/layout.tsx**: 학생 역할일 때 본인 id가 아니면 /student/[session.studentId]로 리다이렉트.
- **(dashboard)/layout.tsx**: 학생 세션일 때 /student/[session.studentId]로 리다이렉트.
- **getStudent** named export 추가 (parent 페이지 호환).
- **parentService** FieldValue 사용 오류 수정 (admin.firestore.FieldValue).
- **parent 페이지** 타입 오류 수정 (learningRecords, assignments, schoolName, isReadOnly).
