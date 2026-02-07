/**
 * Firestore users 컬렉션 문서 타입 (NextAuth 소셜/학부모 아이디·비밀번호 통합)
 */
export type UserRole = "ADMIN" | "PARENT" | "STUDENT";
export type UserStatus = "PENDING" | "APPROVED";

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

export type FirestoreUser = FirestoreUserParent | FirestoreUserStudent | (FirestoreUserBase & { role: "ADMIN" });
