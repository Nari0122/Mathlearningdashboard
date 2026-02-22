/**
 * 역할별 Firestore 문서 타입. 실제 사용 컬렉션: students, parents, admins (users 컬렉션 미사용).
 * 관리자: role = SUPER_ADMIN | ADMIN, status = PENDING | APPROVED (Super Admin 승인 후 이용 가능)
 */
export type UserRole = "SUPER_ADMIN" | "ADMIN" | "PARENT" | "STUDENT";
export type UserStatus = "PENDING" | "APPROVED";

/** 학생/계정 활성 상태. DB(students)에서 관리. INACTIVE면 로그인 차단 */
export type AccountStatus = "ACTIVE" | "INACTIVE";

/** 관리자 전용 역할 (유저 테이블 role 필드) */
export type AdminRole = "SUPER_ADMIN" | "ADMIN";

export interface FirestoreUserBase {
    uid: string;
    username?: string;
    name: string;
    role: UserRole;
    createdAt: string;
    email?: string;
    image?: string;
}

export interface FirestoreUserParent extends FirestoreUserBase {
    role: "PARENT";
    status: "APPROVED";
    passwordHash?: string;
    studentIds?: string[];
    phoneNumber?: string;
}

export interface FirestoreUserStudent extends FirestoreUserBase {
    role: "STUDENT";
    status: UserStatus;
    schoolName?: string;
    grade?: string;
    phone?: string;
    parentId?: string;
}

/** 관리자 유저 (Super Admin / Admin). 가입 시 status=PENDING, Super Admin 승인 후 APPROVED */
export interface FirestoreUserAdmin extends FirestoreUserBase {
    role: "SUPER_ADMIN" | "ADMIN";
    status: UserStatus;
    phoneNumber: string;
    passwordHash?: string;
}

export type FirestoreUser =
    | FirestoreUserParent
    | FirestoreUserStudent
    | FirestoreUserAdmin;
