"use server";

import { parentService } from "@/services/parentService";
import { studentService } from "@/services/studentService";
import { userService } from "@/services/userService";

/** 이미 가입된 uid인지 확인 (students, parents, users(관리자)). 중복 회원가입 방지용 */
export async function checkExistingUserByUid(uid: string): Promise<{
    kind: "student" | "parent" | "admin" | null;
    redirect: string;
    message: string;
}> {
    const existingStudent = await studentService.getStudentByUid(uid);
    if (existingStudent) {
        const status = (existingStudent as { approvalStatus?: string }).approvalStatus;
        const redirect = status === "PENDING" ? "/pending-approval" : `/student/${existingStudent.id}`;
        return { kind: "student", redirect, message: "이미 가입된 유저입니다. 학생으로 등록되어 있습니다." };
    }
    const existingParent = await parentService.getParentByUid(uid);
    if (existingParent) {
        return { kind: "parent", redirect: "/parent/dashboard", message: "이미 가입된 유저입니다. 학부모로 등록되어 있습니다." };
    }
    const existingUser = await userService.getUser(uid);
    if (existingUser && (existingUser as { role?: string }).role === "ADMIN") {
        return { kind: "admin", redirect: "/login", message: "이미 가입된 유저입니다. 관리자는 로그인 화면에서 로그인해 주세요." };
    }
    return { kind: null, redirect: "", message: "" };
}

/** 학부모 완료: parents 컬렉션에 등록 (이미 있으면 스킵). 리다이렉트 URL 반환 */
export async function registerParent(data: {
    uid: string;
    name?: string | null;
    image?: string | null;
}): Promise<{ success: true; redirect: string } | { success: false; message: string }> {
    const existing = await parentService.getParentByUid(data.uid);
    if (existing) {
        return { success: true, redirect: "/parent/dashboard" };
    }
    const result = await parentService.createParent(data);
    if (!result.success) {
        return result;
    }
    return { success: true, redirect: "/parent/dashboard" };
}

/** 학생 완료: doc ID = uid(카카오 uid). 추가정보 저장 시에만 students 문서 생성 */
export async function registerStudentFromSignup(data: {
    uid: string;
    name: string;
    phone: string;
    schoolName: string;
    schoolType: string;
    grade: string;
    parentPhone: string;
    parentRelation: string;
}): Promise<
    | { success: true; redirect: string; id: number }
    | { success: false; message: string }
> {
    const { uid, ...rest } = data;
    const existing = await studentService.getStudentByUid(uid);
    if (existing) {
        const status = (existing as { approvalStatus?: string }).approvalStatus;
        if (status === "PENDING") {
            return { success: true, redirect: "/pending-approval", id: existing.id };
        }
        return { success: true, redirect: `/student/${existing.id}`, id: existing.id };
    }
    const result = await studentService.createStudentWithDocId(uid, {
        ...rest,
        username: `student_${Date.now()}`,
        approvalStatus: "PENDING",
    });
    if (!result.success) {
        return { success: false, message: result.message };
    }
    return {
        success: true,
        redirect: "/pending-approval",
        id: result.id,
    };
}
