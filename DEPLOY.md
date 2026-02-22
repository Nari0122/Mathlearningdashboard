# GitHub & Vercel 배포 가이드

## 1. GitHub에 올리기

### 1-1. GitHub에서 새 저장소 만들기
1. https://github.com/new 접속
2. Repository name 입력 (예: `math-dashboard`)
3. **Public** 선택, **Create repository** 클릭
4. "…or push an existing repository from the command line" 안내가 나오면 아래 주소를 복사해 둡니다.

### 1-2. 로컬에서 원격 추가 후 푸시
터미널에서 프로젝트 루트(`ver.2222`)로 이동한 뒤:

```bash
cd "/Users/nari/과외 앱 만들기/엡 파일/ver.2222"

# 아래 YOUR_USERNAME, YOUR_REPO 이름을 본인 GitHub 사용자명과 저장소 이름으로 바꾸세요.
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

git push -u origin main
```

- 이미 `origin`이 있다면: `git remote set-url origin https://github.com/YOUR_USERNAME/YOUR_REPO.git`
- 브랜치가 `master`라면: `git push -u origin master`

---

## 2. Vercel에 배포하기

### 방법 A: Vercel 웹에서 GitHub 연결 (권장)
1. https://vercel.com 로그인
2. **Add New…** → **Project**
3. **Import Git Repository**에서 방금 푸시한 GitHub 저장소 선택
4. **Root Directory**를 `math-dashboard-next`로 설정 (반드시 설정)
5. **Environment Variables**에 `.env.local`에 쓰던 값 추가:
   - `NEXT_PUBLIC_FIREBASE_*` 전부
   - `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` (또는 서비스 계정 JSON 경로)
   - `NEXTAUTH_URL` = 배포된 URL (예: `https://your-app.vercel.app`)
   - `NEXTAUTH_SECRET`, 카카오/구글 등 OAuth 키
6. **Deploy** 클릭

### 방법 B: Vercel CLI로 배포
```bash
cd "/Users/nari/과외 앱 만들기/엡 파일/ver.2222/math-dashboard-next"
npx vercel
```
- 처음이면 로그인/가입 후, 프로젝트 연결 시 **Root Directory**가 `math-dashboard-next`가 되도록 확인 (상위에서 실행했다면 설정에서 Root를 `math-dashboard-next`로 지정).

---

## 3. 배포 후 확인
- Vercel이 제공하는 URL(예: `https://math-dashboard-xxx.vercel.app`)에서 앱 동작 확인
- Firebase/카카오 로그인 등은 **승인된 도메인**에 배포 URL을 추가해야 할 수 있음 (Firebase Console, 카카오 개발자 콘솔)
