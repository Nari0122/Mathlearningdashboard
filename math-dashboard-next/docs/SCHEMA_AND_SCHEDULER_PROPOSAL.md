# 일정/숙제 자동 상태 업데이트 및 과제 제출 마감(Dead-line Lock) 제안서

## 1. 요구사항 요약

| 구분 | 트리거 | 동작 |
|------|--------|------|
| **1. 일정/숙제 자동 상태** | 숙제 마감 기한 또는 수업 시작 시간 경과 | 진행 중/미제출 → 미완료·기한 만료로 변경; 수업 종료 일정 → 수업 완료로 이동/업데이트 |
| **2. 과제 제출 시간 제한** | 수업 시작 1시간 전 = 최종 마감 | 수업 1시간 전부터 학생 '과제 제출' 버튼 비활성화 + 안내 메시지; 관리자 데이터 무결성 보장 |

---

## 2. 데이터베이스 스키마 수정 사항 (Firestore)

현재 구조: `students/{studentId}/assignments`, `students/{studentId}/schedules` 하위 컬렉션 사용.

### 2.1 Assignments (숙제) 문서 스키마

**추가/변경 필드:**

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `submissionDeadline` | string (ISO 8601) | 권장 | **최종 제출 마감 시각** (수업 시작 1시간 전). 없으면 `dueDate` 23:59:59(Asia/Seoul)로 간주 |
| `linkedScheduleId` | string | 선택 | 연관 수업 일정 문서 ID. 있으면 해당 수업 `date`+`startTime` 기준으로 `submissionDeadline` 계산 |
| `status` | string | 필수 | 아래 enum 확장 |

**`status` enum 확장:**

| 값 | 의미 | 비고 |
|----|------|------|
| `pending` | 진행 중(미제출) | 기존 |
| `submitted` | 제출 완료 (기한 내) | 기존 |
| `late-submitted` | 지각 제출 | 기존 |
| **`overdue`** | **미완료** | 마감일(dueDate)은 지났으나 아직 제출 가능(제출 버튼 활성) |
| **`expired`** | **기한 만료** | `submissionDeadline` 경과 → 제출 불가, 스케줄러가 자동 설정 |

- 제출 완료 데이터: `submittedDate` 존재 시 제출 완료로 간주. `submittedDate` 없고 마감/최종마감 경과 시 스케줄러가 `overdue` 또는 `expired`로 변경.

**기존 필드 유지:** `title`, `dueDate`, `assignedDate`, `submittedDate`, `createdAt` 등.

**예시 문서:**

```json
{
  "title": "다항식 워크북 10pg-15pg",
  "dueDate": "2026-02-03",
  "assignedDate": "2026-01-30",
  "submissionDeadline": "2026-02-06T17:00:00+09:00",
  "linkedScheduleId": "abc123",
  "status": "pending",
  "submittedDate": null,
  "createdAt": "2026-01-30T..."
}
```

- `submissionDeadline`: 해당 수업이 2026-02-06 18:00 시작이면 1시간 전 17:00.

### 2.2 Schedules (일정) 문서 스키마

**기존 필드:** `date`, `startTime`, `endTime`, `status`, `isRegular`, `sessionNumber`, `topic`, `feedback` 등.

**`status` 값 정리:**

| 값 | 의미 |
|----|------|
| `scheduled` | 예정 |
| **`completed`** | **수업 완료** (수업 종료 시간 경과 시 스케줄러가 설정) |
| `CANCELLED` | 취소 |
| `POSTPONED` / `CHANGED` | 연기/일정변경 등 (기존 유지) |

- 수업 종료 시각: `date` + `endTime` (예: `"2026-02-06"` + `"20:00"` → Asia/Seoul 기준 해당 일 20:00). 이 시각이 경과하면 스케줄러가 `status`를 `completed`로 업데이트.

### 2.3 인덱스 (필요 시)

- **Assignments:**  
  - `dueDate` ASC, `status` ASC (마감일·상태별 배치 처리)  
  - `submissionDeadline` ASC (마감 lock 배치 처리)  
- **Schedules:**  
  - `date` ASC, `status` ASC (과거 일정 완료 처리)

Firestore에서 복합 쿼리 사용 시 콘솔에서 해당 조건으로 인덱스 생성.

---

## 3. 백엔드 스케줄러 구현 방안 (Cron Job)

### 3.1 실행 주기 제안

- **권장:** 1분마다 실행 (또는 5분마다로 부하 조절).
- 목적:  
  - 숙제: 마감일/`submissionDeadline` 경과 분 단위로 상태 갱신.  
  - 일정: 수업 종료 시각 경과 시 `completed` 처리.

### 3.2 구현 옵션

#### 옵션 A: Next.js API Route + 외부 Cron 서비스 (권장)

- **동작:**  
  - 프로젝트에 인증이 붙은 API 라우트 예: `POST /api/cron/update-status` 추가.  
  - Cron-job.org, Vercel Cron, AWS EventBridge 등에서 1분(또는 5분)마다 해당 URL 호출.
- **장점:** 기존 Next.js + Firestore 구조 그대로 사용, 배포 간단.
- **보안:** 요청 헤더에 시크릿 토큰 검사 (예: `Authorization: Bearer <CRON_SECRET>` 또는 `x-cron-secret`).

#### 옵션 B: Firebase Cloud Functions (onSchedule)

- **동작:**  
  - `functions.pubsub.schedule('every 1 minutes').onRun(...)` 에서 동일 로직 실행.  
  - `firebase-admin`으로 Firestore 직접 접근.
- **장점:** Firebase와 통합 좋고, 별도 서버 없이 동작.
- **단점:** Cloud Functions 프로젝트/배포 설정 필요.

#### 옵션 C: 별도 Node 스크립트 + PM2/systemd

- **동작:**  
  - `node-cron`으로 1분마다 실행되는 스크립트 작성.  
  - 해당 스크립트에서 Firestore Admin SDK로 배치 업데이트.
- **장점:** 서버가 있으면 완전 자체 관리 가능.
- **단점:** 서버 상시 실행 및 모니터링 필요.

아래는 **옵션 A** 기준 **스케줄러가 호출할 로직**을 서비스/API 형태로 정리한 것입니다.

### 3.3 스케줄러 로직 상세 (공통 적용)

#### (1) 숙제 상태 자동 업데이트

- **대상:**  
  - `status` ∈ `pending`, `overdue`  
  - `submittedDate` 없음 (미제출)
- **규칙:**  
  - 현재 시각(Asia/Seoul) ≥ `submissionDeadline` → `status = 'expired'`  
  - 그 외, 현재 날짜 > `dueDate` → `status = 'overdue'`  
- **처리:**  
  - 모든 `students` 문서 순회 → 각 학생의 `assignments` 서브컬렉션에서 위 조건 만족 문서를 배치로 `update` (필요 시 Firestore batch 500건 제한 고려).

#### (2) 수업 일정 → 수업 완료

- **대상:**  
  - `status === 'scheduled'`  
  - `date` + `endTime` (Asia/Seoul 해석) < 현재 시각
- **동작:**  
  - 해당 schedule 문서의 `status`를 `'completed'`로 업데이트.

#### (3) 과제 생성 시 `submissionDeadline` 설정

- **관리자 숙제 생성/수정 시:**  
  - `linkedScheduleId`가 있으면: 해당 schedule의 `date` + `startTime`에서 1시간을 뺀 시각을 `submissionDeadline`(ISO 8601)으로 저장.  
  - 없으면: `submissionDeadline = dueDate` 23:59:59 (Asia/Seoul).  
- 이렇게 하면 “수업 1시간 전 = 최종 마감” 규칙이 DB와 스케줄러, 프론트와 일치합니다.

---

## 4. Dead-line Lock (과제 제출 버튼 비활성화) 프론트/백 동작

### 4.1 학생 화면 (과제 제출 버튼)

- **조건:**  
  - 현재 시각(클라이언트 또는 서버 기준) ≥ `assignment.submissionDeadline` (또는 `submissionDeadline` 없으면 `dueDate` 23:59:59)  
  → 제출 불가.
- **UI:**  
  - 해당 카드에서 ‘과제 제출’/‘완료하기’ 버튼 **비활성화(disabled)**.  
  - 안내 문구: **"수업 준비를 위해 과제 제출이 마감되었습니다."**
- **서버:**  
  - `submitHomework` 등 제출 API/Server Action에서도 `submissionDeadline`을 검사하여, 경과했으면 403/메시지로 거절.

### 4.2 관리자

- 마감 시간 이후에는 학생이 제출할 수 없으므로, 그 시점 이후 데이터만으로 수업 준비 가능 (데이터 무결성 보장).

---

## 5. 적용 체크리스트

- [ ] Firestore **assignments** 문서에 `submissionDeadline`, `linkedScheduleId` 추가 및 기존 데이터 마이그레이션(선택).
- [ ] **assignments** `status`에 `overdue`, `expired` 반영 (클라이언트/관리자 UI 표시).
- [ ] **schedules** `status`에 `completed` 자동 설정 로직 반영.
- [ ] **스케줄러:** `/api/cron/update-status` (또는 Cloud Functions/Node 스크립트) 구현 및 1분(또는 5분) 주기 등록.
- [ ] **숙제 생성/수정:** `linkedScheduleId` 선택 시 `submissionDeadline` 자동 계산 저장.
- [ ] **학생 과제 화면:** `submissionDeadline` 경과 시 제출 버튼 비활성화 + "수업 준비를 위해 과제 제출이 마감되었습니다." 메시지.
- [ ] **제출 API/Server Action:** `submissionDeadline` 경과 시 제출 거절.

이 문서를 바탕으로 단계별로 DB 스키마 반영 → 스케줄러 구현 → 프론트 Lock/메시지 적용 순으로 진행하면 됩니다.

---

## 6. 구현 완료 사항 (참고)

- **API:** `POST /api/cron/update-status` — Cron에서 1~5분마다 호출. `CRON_SECRET` 환경변수와 `Authorization: Bearer <CRON_SECRET>` 또는 `x-cron-secret` 헤더로 인증.
- **서비스:** `statusSchedulerService.runAll()` — 숙제 overdue/expired, 일정 completed 자동 갱신.
- **숙제 생성:** 관리자 화면에서 "연관 수업" 선택 시 해당 수업 1시간 전을 `submissionDeadline`으로 저장.
- **학생 화면:** `submissionDeadline` 경과 시 제출 버튼 비활성화 + "수업 준비를 위해 과제 제출이 마감되었습니다." 표시.
- **제출 검증:** `submitHomework`에서 마감 경과 시 제출 거절.
