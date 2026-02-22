# 역할 기반 통합 회원가입 시스템 설계

Next.js 14 (App Router) + NextAuth + Firebase 단일 `users` 컬렉션 기반 설계안.

---

## 1. 진입 및 UI 흐름

### 1.1 전체 플로우

```
[로그인 화면]
    하단: [회원가입] 버튼
         ↓
[역할 선택 페이지]  (/signup/role)
    "학생인가요?" / "학부모인가요?" 선택
    → 선택값을 상태로 유지 (예: URL query ?role=STUDENT | ?role=PARENT 또는 sessionStorage/state)
         ↓
[소셜 로그인 페이지]  (/signup/auth?role=STUDENT | /signup/auth?role=PARENT)
    네이버 / 카카오 / 구글 버튼만 노출
    역할 정보는 query 또는 cookie에 유지
         ↓
    NextAuth signIn(provider) 호출
         ↓
[NextAuth 콜백 처리]
    → 신규 유저 여부 판단 (Firestore users/{uid} 존재 여부)
    → 없으면: redirect to 추가정보 입력 (역할별)
    → 있으면: 기존 로그인 플로우 (역할별 홈)
         ↓
[추가 정보 입력]  (신규만)
    PARENT: /signup/complete-parent  (본인인증 + 아이디/비밀번호)
    STUDENT: /signup/complete-student (이름, 연락처, 학교명, 학년)
         ↓
[Firestore 저장] → 역할별 결과 페이지
    PARENT: status APPROVED → 학부모 대시보드 허용
    STUDENT: status PENDING → "승인 대기" 안내, 대시보드 차단
```

### 1.2 상태 유지 전략

- **역할(role) 전달**: 소셜 로그인 요청 시점까지 역할을 유지해야 함.
  - **권장**: NextAuth `signIn(provider, { callbackUrl: `/signup/complete?role=${role}` })` 처럼 `callbackUrl`에 role을 실어 보내거나, **NextAuth의 custom `callbackUrl`** 을 사용. 단, OAuth 리다이렉트 후에는 쿼리가 유지되므로 **콜백 URL에 role 포함** (`/api/auth/callback/...` 이후 리다이렉트할 URL을 `/signup/complete-parent` 또는 `/signup/complete-student?role=STUDENT` 등으로 서버에서 결정).
  - **대안**: 소셜 로그인 직전에 **암호화된 role을 쿠키**에 저장하고, 콜백/추가정보 페이지에서 쿠키를 읽어 사용 후 삭제.

---

## 2. 데이터 구조 (Single Collection)

### 2.1 Firestore `users` 문서

- **문서 ID**: Firebase Auth UID와 1:1 매핑 권장. (NextAuth 사용 시 NextAuth가 발급하는 `id` 또는 Provider `sub`를 uid로 사용.)
- **공통 필드**
  - `uid`: string (문서 ID와 동일 또는 provider sub)
  - `username`: string (서비스 내 로그인 아이디, PARENT는 추가 입력)
  - `name`: string (소셜에서 오거나 추가 입력)
  - `role`: `"ADMIN"` | `"PARENT"` | `"STUDENT"`
  - `createdAt`: string (ISO)
  - `email`: string? (소셜 이메일, 중복 체크용)
  - `image`: string? (소셜 프로필 이미지)
- **PARENT 전용**
  - `passwordHash`: string? (bcrypt 등으로 해시한 비밀번호; 아이디/비밀번호 로그인용)
  - `status`: `"APPROVED"` (가입 완료 시 곧바로 APPROVED)
  - `studentIds`: string[] (자녀 uid 목록, 나중에 연동)
  - `phoneNumber`: string? (본인인증 연락처 등)
- **STUDENT 전용**
  - `status`: `"PENDING"` | `"APPROVED"` (가입 시 PENDING, 관리자 승인 후 APPROVED)
  - `schoolName`: string
  - `grade`: string
  - `phone`: string
  - `parentId`: string? (연동 학부모 uid)

### 2.2 소셜 UID와 username/password 병합

- **한 문서에 모두 저장**: 동일한 `users/{uid}` 문서에
  - 소셜에서 온 필드: `name`, `email`, `image`, `uid`(provider sub)
  - 추가 입력 필드: `username`, `passwordHash`(PARENT), `schoolName`, `grade`, `phone`(STUDENT) 등
- **로그인 경로 두 가지**
  1. **소셜 로그인**: NextAuth OAuth → 동일 uid로 세션 생성.
  2. **아이디/비밀번호 로그인**(학부모): NextAuth Credentials Provider 또는 자체 API에서 `username` + 비밀번호 검증 후, 해당 유저의 `uid`로 NextAuth 세션에 넣어줌. (Firestore에서 `username`으로 문서 조회 후 `passwordHash` 비교.)

---

## 3. NextAuth 설정 전략

### 3.1 Provider 구성

- **Providers**: Google, Kakao, Naver (OAuth).
- **Credentials Provider**(선택): 학부모의 아이디/비밀번호 로그인용. NextAuth의 Credentials는 DB 조회 + 비밀번호 검증 후 `user` 객체를 반환하도록 구현.

### 3.2 signIn 콜백 (신규 유저 판단의 핵심)

- **역할**: 소셜 로그인 직후, **한 번만** 실행되는 진입점.
- **로직**:
  1. `user.id`(또는 `account.providerAccountId`)를 uid로 사용.
  2. Firestore `users/{uid}` 문서 존재 여부 조회 (Admin SDK 또는 API 라우트에서 조회).
  3. **문서 없음** → 신규 유저:
     - `callbackUrl`을 **역할에 따라** `/signup/complete-parent` 또는 `/signup/complete-student`로 덮어쓰기. (이때 역할 정보는 signIn 호출 시 전달한 `callbackUrl` 쿼리나 쿠키에서 가져와야 함.)
     - 또는 `redirect: false`로 하고 클라이언트에서 `session.newUser === true`로 분기해 해당 완료 페이지로 이동.
  4. **문서 있음** → 기존 유저:
     - 역할별 홈으로 `callbackUrl` 설정 (예: PARENT → `/parent/dashboard`, STUDENT → `/student/...`).
     - STUDENT인 경우 `status === 'PENDING'`이면 "승인 대기" 전용 페이지로 보내기.
  5. **반환**: `true`면 로그인 성공, `false`면 실패. 리다이렉트 URL 제어는 `redirect` 인자나 반환 URL로 처리.

- **역할 전달 문제**: signIn은 서버 콜백이므로, "지금 가입 시도한 역할"을 알려면
  - **방법 A**: `signIn(provider, { callbackUrl: '/signup/complete?role=PARENT' })` 처럼 callbackUrl에 role을 넣고, 콜백 단계에서 이 URL을 파싱해 "완료 페이지"를 결정.
  - **방법 B**: 소셜 로그인 요청 직전에 쿠키에 `signup_role=PARENT` 저장 → signIn 콜백에서 해당 쿠키를 읽어 완료 페이지 결정 후 쿠키 삭제.

### 3.3 jwt 콜백 (세션에 role·status 주입)

- **역할**: 토큰이 생성/갱신될 때마다 실행. DB에서 최신 role, status를 세션에 넣기 위해 사용.
- **로직**:
  1. `token.sub`(또는 저장한 uid)로 Firestore `users/{uid}` 조회.
  2. `user.role`, `user.status`를 `token.role`, `token.status`에 할당.
  3. (선택) `token.uid` = 문서 id.
  4. `session` 콜백에서 `session.user.role`, `session.user.status`를 노출하도록 매핑.
- **효과**: 클라이언트/미들웨어에서 `session.user.role`, `session.user.status`로 권한·승인 여부 판단 가능.

### 3.4 session 콜백

- **역할**: 클라이언트에 넘겨줄 session 객체 형태 정의.
- **로직**: `token.role`, `token.status`, `token.uid`를 `session.user`에 그대로 매핑. 필요 시 `session.user.id` = uid.

### 3.5 미들웨어에서의 활용

- **보호 구간**: `/admin/*`, `/student/*`, `/parent/*` 등.
- **판단**:
  - 세션 없음 → `/login` 리다이렉트.
  - 세션 있으나 `role` 불일치 (예: PARENT가 `/student/*` 접근) → 역할별 홈 또는 403.
  - STUDENT이고 `status === 'PENDING'` → `/pending-approval` 등 고정 페이지로만 허용, 나머지 `/student/*` 차단.

---

## 4. Firestore 저장 프로세스 (단계별)

### 4.1 소셜 로그인 직후 (신규일 때)

- **아직 users 문서를 만들지 않음.** "신규"임만 판단하고, 추가 정보 입력 페이지로 보냄.
- (선택) "임시" 문서를 만들 수 있으나, 역할·추가정보 없이는 불완전하므로 **완료 폼 제출 시 한 번에 생성**하는 편이 단순함.

### 4.2 추가 정보 입력 완료 시 (한 번에 저장)

- **PARENT**
  1. 본인인증(외부 API/서비스) 수행 후, 서비스 아이디·비밀번호 수집.
  2. **중복 체크**: Firestore에서 `username`으로 기존 문서 조회 (또는 `email`로 조회). 있으면 "이미 사용 중" 반환.
  3. **저장**: `users/{uid}` 문서 생성/덮어쓰기.
     - `uid`: NextAuth에서 쓰는 uid(소셜 sub).
     - `username`, `passwordHash`(bcrypt), `name`, `email`, `image`, `role: 'PARENT'`, `status: 'APPROVED'`, `createdAt`, `studentIds: []`, `phoneNumber`(본인인증 결과 등).
  4. 세션 갱신(재로그인 또는 session update) 후 학부모 대시보드 허용.

- **STUDENT**
  1. 이름, 연락처, 학교명, 학년 수집.
  2. **중복 체크**: 동일 `email`(소셜 이메일)로 이미 `users`에 문서가 있는지 확인. (같은 소셜로 재가입 방지.)
  3. **저장**: `users/{uid}` 문서 생성.
     - `uid`, `name`, `email`, `image`, `role: 'STUDENT'`, `status: 'PENDING'`, `schoolName`, `grade`, `phone`, `createdAt`.
  4. "관리자 승인 대기" 안내 페이지로 이동. 이후 로그인 시에도 `status === 'PENDING'`이면 대시보드 대신 승인 대기 페이지만 허용.

### 4.3 기존 유저 로그인 시

- **문서 존재**: signIn 콜백에서 이미 판단했으므로, jwt/session에 role·status 주입 후 역할별 홈 또는 PENDING 전용 페이지로만 이동.

### 4.4 중복 가입 방지 정리

- **username**: PARENT 추가정보 단계에서 입력. 저장 전에 `users` 컬렉션에서 `username` 일치 문서 조회. 있으면 "이미 사용 중인 아이디" 처리.
- **email**: 소셜에서 온 이메일. 신규 STUDENT/PARENT 저장 전에 `email`로 조회해 동일 사용자 있으면 "이미 가입된 이메일" 처리. (동일 소셜 재가입 방지.)
- **uid**: 소셜 provider + sub 조합은 NextAuth가 보장하므로, 한 소셜 계정당 한 uid. 동일 uid로 문서가 이미 있으면 "기존 유저"로 간주하고 추가정보 폼을 건너뜀.

---

## 5. 페이지/라우트 구성 제안

| 경로 | 용도 |
|------|------|
| `/` 또는 `/login` | 로그인 화면, 하단 [회원가입] |
| `/signup/role` | 역할 선택 (학생 / 학부모) |
| `/signup/auth?role=STUDENT\|PARENT` | 소셜 버튼만 노출, NextAuth signIn 호출 |
| `/signup/complete-parent` | 학부모 추가정보 (본인인증 + 아이디/비밀번호) |
| `/signup/complete-student` | 학생 추가정보 (이름, 연락처, 학교, 학년) |
| `/pending-approval` | STUDENT PENDING 전용 안내, 대시보드 차단 |
| `/api/auth/[...nextauth]` | NextAuth API 라우트 |

---

## 6. 구현 순서 제안

1. **NextAuth 기본 설정**: Providers(Google, Kakao, Naver), NEXTAUTH_URL, 시크릿, Adapter 없이 먼저 동작 확인.
2. **signIn 콜백**: uid로 Firestore 조회, 신규/기존 분기, callbackUrl 또는 쿠키로 역할 전달해 완료 페이지로 리다이렉트.
3. **jwt + session 콜백**: Firestore에서 role·status 읽어 토큰/세션에 주입.
4. **회원가입 UI**: 로그인 하단 [회원가입] → `/signup/role` → `/signup/auth?role=...` → 소셜 로그인.
5. **완료 페이지**: PARENT/STUDENT 각각 폼, 중복 체크, Firestore `users` 문서 생성.
6. **미들웨어**: 역할·status 기반 라우트 보호 및 PENDING 리다이렉트.
7. **Credentials Provider**(선택): 학부모 아이디/비밀번호 로그인 시 Firestore에서 username 조회 후 uid 매핑해 세션 부여.

이 순서로 구현하면 "역할 선택 → 소셜 인증 → 역할별 추가정보 → 단일 users 문서 저장 → 역할·승인 상태 기반 접근 제어"까지 일관되게 연결할 수 있다.
