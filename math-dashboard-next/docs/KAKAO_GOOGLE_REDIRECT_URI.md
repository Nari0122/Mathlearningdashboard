# 카카오 / 구글 로그인 Redirect URI 등록

소셜 로그인 시 "Redirect URI가 일치하지 않습니다" 오류가 나면, 각 개발자 콘솔에 **아래 주소를 그대로** 등록해야 합니다.

## NEXTAUTH_URL에 맞춰 사용

`.env.local`의 `NEXTAUTH_URL`이 `http://localhost:3000` 이면 아래처럼 등록하세요.

---

## 카카오 (Kakao Developers)

1. [Kakao Developers](https://developers.kakao.com) → **내 애플리케이션**
2. 앱 선택 → **카카오 로그인** (또는 **카카오 로그인** 메뉴)
3. **Redirect URI**에 아래 한 줄을 **그대로** 추가 후 저장

```
http://localhost:3000/api/auth/callback/kakao
```

- **주의**: 끝에 `/` 없음, `http` (로컬은 https 아님), 포트 `3000`
- 여러 개 등록 가능하므로, 로컬용·배포용을 각각 추가해 두면 됨

---

## 구글 (Google Cloud Console)

1. [Google Cloud Console](https://console.cloud.google.com) → 해당 프로젝트
2. **API 및 서비스** → **사용자 인증 정보** → OAuth 2.0 클라이언트 ID 선택(또는 생성)
3. **승인된 리디렉션 URI**에 아래 한 줄 추가 후 저장

```
http://localhost:3000/api/auth/callback/google
```

- 배포 시에는 `https://(도메인)/api/auth/callback/google` 도 추가

---

## 배포 시 (예: Vercel)

`NEXTAUTH_URL=https://your-domain.com` 이면:

- 카카오: `https://your-domain.com/api/auth/callback/kakao`
- 구글: `https://your-domain.com/api/auth/callback/google`

위 두 주소를 각각 카카오/구글 콘솔에 추가하면 됩니다.

---

## Vercel에서 `client_id is required` 오류 시

**원인**: `KAKAO_CLIENT_ID`가 Vercel 런타임에 비어 있음 (빌드 시 환경 변수 미주입)

**확인·해결 절차**:

1. **올바른 프로젝트에 설정**
   - `math-dashboard-next.vercel.app`과 `mathlearningdashboard.vercel.app`은 서로 다른 프로젝트일 수 있음
   - 접속하는 도메인과 같은 Vercel 프로젝트의 Environment Variables를 수정

2. **필수 환경 변수 (Production용)**
   - `NEXTAUTH_URL` = 실제 배포 URL (예: `https://mathlearningdashboard.vercel.app`)
   - `KAKAO_CLIENT_ID` = 카카오 REST API 키 (비어 있으면 안 됨)
   - `KAKAO_CLIENT_SECRET` = 카카오 보안 설정 시크릿
   - `NEXTAUTH_SECRET` = 임의의 긴 문자열

3. **변수 이름·값 점검**
   - `KAKAO_CLIENT_ID` (대소문자 정확히)
   - 값 앞뒤 공백 없음
   - 복사 시 줄바꿈 포함되지 않았는지 확인

4. **환경 변수 수정 후 재배포**
   - Vercel 대시보드 → Deployments → 최신 배포 오른쪽 ⋮ → **Redeploy**

5. **카카오 Redirect URI 등록**
   - [카카오 디벨로퍼스](https://developers.kakao.com) → 내 애플리케이션 → 카카오 로그인
   - `https://(실제도메인)/api/auth/callback/kakao` 추가

---

## Vercel에서 `NO_SECRET` (Please define a secret in production) 오류 시

**원인**: `NEXTAUTH_SECRET`이 코드에서 `undefined`로 고정됨. Next.js/webpack이 빌드 시 `process.env.NEXTAUTH_SECRET`를 정적 치환하는데, 그 시점에 값이 없으면 `undefined`가 번들에 박힘. **코드 수정**: `getNextAuthSecret()`에서 `require('process').env`로 런타임 env를 직접 읽어 DefinePlugin 치환을 회피함.

**확인·해결 절차**:

1. **환경(Environment) scope 확인**
   - Production URL로 접속 중이라면 → `NEXTAUTH_SECRET`이 **Production**에 체크되어 있는지 확인
   - Preview URL(PR, 브랜치 배포)로 접속 중이라면 → **Preview**에도 `NEXTAUTH_SECRET` 설정 필요

2. **Vercel System Environment Variables 노출 여부**
   - Project Settings → Environment Variables
   - **"Automatically expose System Environment Variables"** 체크 여부 확인 (NextAuth 권장)

3. **`AUTH_SECRET` 별칭 시도**
   - NextAuth는 `NEXTAUTH_SECRET` 외에 `AUTH_SECRET`도 인식함
   - `AUTH_SECRET` 이름으로 동일한 값을 추가해 보기

4. **빌드 캐시 무시 후 재배포**
   - Deployments → 최신 배포 ⋮ → **Redeploy** 시 **"Clear Build Cache"** 옵션 체크
