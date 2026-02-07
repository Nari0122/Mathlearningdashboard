# 로그인 구조와 Firebase Authentication

## 현재 구조

- **카카오/구글/네이버 로그인**: **NextAuth**로 처리합니다.
  - NextAuth가 각 제공자(Kakao, Google, Naver)와 OAuth만 하고, 세션은 NextAuth JWT로 유지합니다.
  - **Firebase Authentication은 사용하지 않습니다.**  
    → 따라서 Firebase 콘솔의 **Authentication** 탭에는 카카오/구글/네이버로 가입·로그인한 사용자가 **나타나지 않는 것이 정상**입니다.

- **저장 위치**
  - **학생**: Firestore **`students`** 컬렉션 (카카오는 `kakaoId` + name, email, image 등)
  - **학부모**: Firestore **`parents`** 컬렉션
  - **관리자**: 환경 변수(ADMIN_LOGIN_ID / ADMIN_LOGIN_PASSWORD) + **`auth-actions`** (아이디/비밀번호)

- **Firebase를 쓰는 부분**
  - **Firestore**: 학생/학부모 문서, 학습 데이터 등
  - **Firebase Admin SDK**: 서버에서 Firestore 조회·저장
  - **Firebase Authentication**: 현재 **미사용** (소셜 로그인은 NextAuth 전담)

## Firebase Authentication에 사용자를 넣고 싶다면

소셜 로그인 사용자를 Firebase Auth에도 남기려면 다음 중 하나가 필요합니다.

1. **Firebase Auth를 메인으로 사용**  
   - 클라이언트에서 `signInWithPopup(getAuth(), new OAuthProvider('oidc.kakao'))` 등으로 로그인  
   - 그러면 Firebase Authentication에 사용자가 생성됩니다.  
   - 이 경우 NextAuth 대신(또는 연동) Firebase Auth + Firestore만으로 세션/회원가입을 설계해야 합니다.

2. **NextAuth 유지 + Firebase Auth 동기화**  
   - NextAuth 로그인 성공 후, 서버에서 Firebase Admin `auth.createUser()` 또는 custom token 발급으로 Firebase Auth에 사용자를 만들거나  
   - 클라이언트에서 Firebase Auth에 custom token으로 로그인하는 방식으로 “동기화”할 수 있습니다.  
   - 구현 난이도와 유지보수 비용이 있어, 필요할 때 별도 설계가 필요합니다.

지금처럼 **NextAuth + Firestore만** 쓰면, 회원가입·로그인은 정상 동작하고, Firebase Authentication 콘솔에는 아무도 안 보이는 구조가 맞습니다.
