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
