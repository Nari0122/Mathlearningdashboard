# Firebase Storage 'No default bucket found' 해결 가이드

## 1. 원인

이미지 업로드 시 `"No default bucket found. Did you set the 'storageBucket' property when initializing the app?"` 오류는 다음 경우에 발생합니다.

- **환경 변수 `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`이 비어 있거나 없음** (Vercel/로컬)
- Firebase 프로젝트에서 **Storage를 아직 사용 설정하지 않음**

---

## 2. 코드 측 조치 (이미 반영됨)

- `src/lib/firebase.ts`에서 **storageBucket**을 다음 순서로 결정합니다.
  1. `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` 환경 변수
  2. 없으면 `NEXT_PUBLIC_FIREBASE_PROJECT_ID`로 **기본 버킷** 사용: `{projectId}.appspot.com`
- `storageBucket`이 없을 때는 `getStorage()`를 호출하지 않아 "No default bucket found"가 나지 않도록 했고,  
  이미지 업로드 시 Storage가 없으면 사용자에게 안내 메시지를 띄우도록 했습니다.

---

## 3. Vercel 환경 변수 설정

Vercel 대시보드에서 아래 환경 변수를 추가/수정하세요.

1. **Vercel** → 해당 프로젝트 선택 → **Settings** → **Environment Variables**
2. 다음 변수들이 있는지 확인하고, **없으면 추가**합니다.

| 이름 | 값 | 설명 |
|------|-----|------|
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | (예: `your-project-id`) | Firebase 프로젝트 ID. **필수.** |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | (예: `your-project-id.appspot.com`) | Storage 버킷. 없으면 `projectId.appspot.com`으로 자동 사용. |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | (예: AIza...) | 웹 API 키 |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | (예: `your-project.firebaseapp.com`) | 인증 도메인 |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | (예: 1:...) | 앱 ID |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | (선택) | 메시징 발신자 ID |

3. **Storage 전용으로만 해결하고 싶을 때**
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`만 추가해도 됩니다.
   - 값: **`{프로젝트 ID}.appspot.com`** (Firebase 콘솔에서 확인 가능, 아래 4번 참고).

4. 저장 후 **재배포**합니다. (Environment Variables 변경 후 Redeploy 필요.)

---

## 4. Firebase 콘솔에서 Storage 사용 설정 (단계별)

Storage를 아직 켜지 않았다면 아래 순서대로 진행하세요.

### 4-1. Firebase 콘솔 접속

1. [Firebase Console](https://console.firebase.google.com/) 접속 후 로그인.
2. 사용 중인 **프로젝트** 선택 (예: mathlearningdashboard에 연결된 프로젝트).

### 4-2. Storage 메뉴 확인

1. 왼쪽 메뉴에서 **Build** → **Storage** 클릭.
2. **"Storage를 사용 설정하려면 여기를 클릭하세요"** 또는 **"Get started"** 버튼이 보이면 아직 비활성화된 상태입니다.

### 4-3. Storage 활성화

1. **"Storage 사용 설정"** / **"Get started"** 클릭.
2. **보안 규칙** 선택:
   - **테스트 모드**: 일정 기간 동안 읽기/쓰기 허용 (개발용).
   - **프로덕션 모드**: 기본적으로 거부 후, 규칙으로 허용 범위 지정 (운영 권장).
3. **위치(리전)** 선택:
   - 가까운 리전 선택 (예: `asia-northeast3` 서울).  
   - 한 번 정하면 나중에 기본 Storage 버킷 위치를 바꾸기 어렵습니다.
4. **"완료"** / **"Done"** 클릭.

### 4-4. 기본 버킷 이름 확인

1. Storage 화면 상단 또는 **파일** 탭에 **버킷 이름**이 표시됩니다.
2. 형식: **`{프로젝트 ID}.appspot.com`** (기본 버킷).
3. 이 값을 Vercel의 `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`에 그대로 넣으면 됩니다.

### 4-5. (선택) 보안 규칙 조정

- **Rules** 탭에서 읽기/쓰기 규칙을 조정할 수 있습니다.
- 예: 인증된 사용자만 특정 경로에 업로드 허용 등.  
  (현재 앱의 `firestore.rules`와 별개로, Storage 전용 규칙입니다.)

---

## 5. 체크리스트

- [ ] Firebase Console → 해당 프로젝트 → **Storage**에서 **사용 설정** 완료.
- [ ] Vercel → **Settings** → **Environment Variables**에  
  `NEXT_PUBLIC_FIREBASE_PROJECT_ID` 및 (선택) `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` 설정.
- [ ] Vercel에서 **Redeploy** 실행.
- [ ] 배포된 사이트(mathlearningdashboard.vercel.app)에서 이미지 업로드 다시 시도.

위까지 적용했는데도 같은 오류가 나면, 브라우저 개발자 도구(F12) → **Console** 탭의 에러 메시지와 **Network** 탭의 실패한 요청을 확인해 보세요.
