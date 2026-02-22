# 관리자 화면에서 숙제/일정/오답/학습기록이 안 보일 때

## 1. 적용한 수정 사항

- **캐시 방지**: 관리자 학생 상세 레이아웃(`/admin/students/[id]`)에 `dynamic = "force-dynamic"`을 넣었습니다.  
  이제 해당 학생의 **숙제 관리, 수업 일정, 오답 노트, 학습 기록** 등은 요청할 때마다 서버에서 Firestore를 다시 조회합니다.  
  예전에 빈 상태로 캐시된 페이지가 계속 보이던 경우를 줄이기 위함입니다.

- **숙제 페이지**: 같은 이유로 숙제 페이지에도 `force-dynamic`을 두었습니다.

- **URL id 해석**: `getStudentDetailByDocId`에서 URL의 `[id]`가 **숫자 문자열**(예: `"1"`)이어도,  
  Firestore에서 `id` 필드가 그 숫자인 학생 문서를 찾아서 사용하도록 했습니다.  
  링크가 예전처럼 숫자 id로만 되어 있어도 같은 학생으로 진입할 수 있습니다.

## 2. 그래도 안 보이면 확인할 것

### (1) Firebase Admin SDK가 뜨는지

관리자용 데이터(숙제, 일정, 오답, 학습 기록)는 **서버**에서 **Firebase Admin SDK**로 Firestore를 읽습니다.  
Admin이 초기화되지 않으면 `adminDb`가 `null`이 되어, 조회 결과가 전부 빈 배열(`[]`)로 나옵니다.

- **로컬**: 프로젝트 루트의 `.env.local`에 다음이 들어 있는지 확인하세요.  
  `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`
- **Vercel 등**: 해당 프로젝트의 Environment Variables에 위 세 개가 설정되어 있는지 확인하세요.  
  `FIREBASE_PRIVATE_KEY`는 여러 줄인 경우 `\n` 이 이스케이프된 한 줄로 넣는 경우가 많습니다.

Admin이 안 뜨면 브라우저에서는 “에러”가 아니라 **빈 목록**으로 보일 수 있습니다.

### (2) 학생 진입 경로

- 관리자 **학생 관리** 목록에서 **카드 클릭**으로 들어가면 URL이  
  `/admin/students/{docId}`  
  형태입니다. 이때 `docId`는 Firestore 학생 문서 ID(보통 긴 문자열)입니다.
- 이 경로로 들어갔을 때만, 해당 학생 문서의 서브컬렉션(assignments, schedules, incorrectNotes, learningRecords 등)을 올바르게 조회합니다.  
  **다른 경로**(예: 직접 URL에 숫자만 입력)로 들어온 경우, 위에서 말한 “숫자 id 해석”으로 같은 학생을 찾도록 바꿔 두었습니다.

### (3) Firestore 데이터 위치

- 숙제: `students/{학생문서ID}/assignments`
- 수업 일정: `students/{학생문서ID}/schedules`
- 오답 노트: `students/{학생문서ID}/incorrectNotes`
- 학습 기록: `students/{학생문서ID}/learningRecords`

Firebase 콘솔에서 해당 학생 문서 ID 아래에 위 컬렉션과 문서가 실제로 있는지 확인해 보세요.

### (4) 브라우저 캐시

- 한 번 빈 화면이 캐시됐을 수 있으니 **강력 새로고침**(Ctrl+Shift+R 또는 Cmd+Shift+R)이나 시크릿 창으로 다시 접속해 보세요.

---

정리하면, **캐시로 인해 예전(빈) 결과가 보이던 경우**는 `force-dynamic`으로 줄였고,  
**숫자 id로 들어오는 경우**도 같은 학생을 찾도록 맞춰 두었습니다.  
그래도 안 보이면 **Firebase Admin 환경 변수**와 **Firestore 데이터 경로**를 위 순서대로 확인하는 것이 좋습니다.
