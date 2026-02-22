# 숙제(Assignments) 데이터 연동 정리

## 1. 저장 위치 (일치함)

- **관리자**가 숙제를 생성하면 **Firestore** `students/{studentDocId}/assignments` 서브컬렉션에 저장됩니다.
- **학생/학부모** 페이지에서 불러오는 쿼리도 동일하게 `learningService.getAssignments(id)` → `students/{해당 학생 문서}/assignments` 를 조회합니다.
- 즉, **한 컬렉션**만 사용하며, 어드민 저장 위치와 학생/학부모 조회 위치는 **일치**합니다.

## 2. 학생별 ID 사용 방식

- **관리자**: URL이 `/admin/students/[docId]` 이므로 항상 **Firestore 문서 ID(docId)** 로 저장합니다.
- **학생**: 로그인 후 `/student/{id}` 로 이동할 때 `id`는
  - 카카오 회원가입 학생: 세션에서 `existingStudent.id`(숫자)를 쓰므로 **숫자 id**가 URL에 올 수 있습니다.
  - 이 숫자 문자열(`"2"` 등)은 서버에서 `getStudentDocIdFromRouteId(routeId)` 로 **docId**로 변환하거나, `learningService.getStudentDocRef` 에서 숫자로 해석해 동일한 학생 문서를 가리키도록 처리했습니다.
- **학부모**: URL이 `/parent/[uid]/student/[id]` 이며, `[id]`는 자녀의 **docId**입니다. layout에서 `studentIds`(자녀 docId 목록)와 매칭해 권한을 검사하고, 같은 `docId`로 `getAssignments(docId)` 를 호출합니다.

## 3. 권한 및 Firestore Rules

- **students/{studentId}** 및 그 하위 **assignments** 등:
  - `allow read: if isAuthenticated() && (isOwner(studentId) || isAdmin());`
  - 즉, **해당 학생 본인(studentId = auth.uid)** 또는 **관리자**만 읽기 가능합니다.
- **학부모**는 클라이언트에서 학생 컬렉션을 직접 읽지 않고, **서버(Next.js)** 에서 **Firebase Admin SDK**로 읽습니다. Admin SDK는 보안 규칙을 우회하므로, 서버 코드에서 `docId`로 조회하면 해당 학생의 숙제를 불러올 수 있습니다. 학부모 layout에서 `studentIds.includes(docId)` 로 자녀만 접근하도록 이미 제한하고 있습니다.

## 4. 수업 1시간 전 마감 로직의 영향

- **리스트 출력 시점**: 숙제 **목록**을 가져올 때는 `submissionDeadline` / 수업 1시간 전 마감 여부로 **필터링하지 않습니다**. 따라서 마감 여부와 관계없이 **등록된 숙제는 모두 목록에 노출**됩니다.
- **제출 버튼/상태**: 마감이 지난 항목은 이미 구현된 대로
  - 제출 버튼 비활성화,
  - "수업 준비를 위해 과제 제출이 마감되었습니다." 메시지,
  - 상태값 `expired` / `overdue` 표시
  만 적용되며, **리스트가 안 보이는 현상의 원인은 아닙니다.**

## 5. 이번 수정에서 한 일

- **Dashboard/Homework** 등 `(dashboard)` 경로: `getFirstStudent()` 대신 **세션 uid**로 `getStudentByUid(uid)` 를 호출해 **로그인한 학생**만 사용하도록 변경했습니다.
- **학생 숙제 페이지** `(student)/student/[id]/homework`: URL의 `id`(숫자 문자열 또는 docId)를 `getStudentDocIdFromRouteId` 로 **docId**로 바꾼 뒤, 같은 docId로 `getAssignments` 를 호출하고, 클라이언트에는 **docId**를 넘겨 제출(submit) 시 올바른 문서를 쓰도록 했습니다.
- **learningService.getStudentDocRef**: 인자가 숫자 문자열(`"2"`)일 때도 **숫자 id**로 해석해 `where("id", "==", num)` 으로 같은 학생 문서를 찾도록 수정했습니다.

이에 따라 **관리자에서 등록한 숙제**가 **학생 페이지**와 **학부모 페이지**에서 동일한 `students/{studentDocId}/assignments` 기준으로 조회·표시되며, 리스트 출력에는 수업 1시간 전 마감 로직이 영향을 주지 않습니다.
