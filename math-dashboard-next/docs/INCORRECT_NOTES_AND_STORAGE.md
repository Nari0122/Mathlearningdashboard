# 오답노트 연동 및 파일 저장 위치

## 1. 관리자 ↔ 학생 ↔ 학부모 연동

**맞습니다. 관리자가 올린 오답노트는 학생·학부모와 동일한 데이터로 연동됩니다.**

- 오답노트는 **해당 학생 문서 아래** Firestore에 저장됩니다.  
  경로: `students/{studentDocId}/incorrectNotes/{noteId}`
- **관리자**: `AdminIncorrectNotesClient`에서 `learningService.getIncorrectNotes(studentDocId)`로 해당 학생의 오답노트 목록을 불러옵니다.
- **학생**: `StudentIncorrectNotesClient`에서 같은 `getIncorrectNotes(studentDocId)`로 **같은 컬렉션**을 조회합니다.
- **학부모**: 학생과 같은 페이지(`/student/[id]/incorrect-notes`)를 **읽기 전용**으로 봅니다. 같은 `getIncorrectNotes(studentDocId)`를 쓰므로 관리자/학생이 본 목록과 동일합니다.

따라서 관리자가 오답노트를 추가·수정·삭제하면, 해당 학생과 학부모 화면에서도 바로 같은 내용이 보입니다.

---

## 2. 사진·파일은 어디에 저장되나요? (Firebase Storage)

**사진과 파일은 Firebase Storage에 저장됩니다.** Firestore에는 파일 내용이 아니라 **저장 경로와 다운로드 URL**만 들어갑니다.

### 저장 경로

- **경로 형식**:  
  `students/{studentDocId}/wrongNotes/{wrongNoteId}/attachments/{fileId}_{원본파일명}`
- **예**:  
  `students/abc123/wrongNotes/temp_1234567890/attachments/uuid_블랙라벨_14페이지_17번.png`

### Firebase Storage가 없을 때

- **Storage 버킷이 설정되지 않으면** (환경 변수 `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` 또는 `NEXT_PUBLIC_FIREBASE_PROJECT_ID` 미설정 등)  
  **업로드 자체가 되지 않고**, 화면에 “Firebase Storage가 설정되어 있어야 합니다…” 안내가 뜹니다.
- 즉, **Storage를 쓰지 않는 모드에서는 사진/파일 업로드는 동작하지 않고**, 오답노트의 텍스트·태그 등만 Firestore에 저장됩니다.

Storage 설정 방법은 `docs/FIREBASE_STORAGE_VERCEL_SETUP.md`를 참고하세요.
