"use server";

import { parentService } from "@/services/parentService";
import { studentService } from "@/services/studentService";
import { userService } from "@/services/userService";

export async function checkExistingUserByUid(uid: string): Promise<{
    kind: "student" | "parent" | "admin" | null;
    redirect: string;
    message: string;
}> {
    const existingStudent = await studentService.getStudentByUid(uid);
    if (existingStudent) {
        return { kind: "student", redirect: "/login", message: "이미 가입된 계정입니다. 로그인해 주세요." };
    }
    const existingParent = await parentService.getParentByUid(uid);
    if (existingParent) {
        return { kind: "parent", redirect: "/login", message: "이미 가입된 계정입니다. 로그인해 주세요." };
    }
    const existingUser = await userService.getAdmin(uid);
    const userRole = (existingUser as { role?: string })?.role;
    if (existingUser && (userRole === "ADMIN" || userRole === "SUPER_ADMIN")) {
        return { kind: "admin", redirect: "/login", message: "이미 가입된 계정입니다. 로그인해 주세요." };
    }
    return { kind: null, redirect: "", message: "" };
}

export async function registerParent(data: {
    uid: string;
    name?: string | null;
    image?: string | null;
}): Promise<{ success: true; redirect: string } | { success: false; message: string }> {
    const existing = await parentService.getParentByUid(data.uid);
    if (existing) {
        return { success: true, redirect: `/parent/${data.uid}/dashboard` };
    }
    const result = await parentService.createParent(data);
    if (!result.success) {
        return result;
    }
    return { success: true, redirect: `/parent/${data.uid}/dashboard` };
}

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
    | { success: true; redirect: string; docId: string }
    | { success: false; message: string }
> {
    const { uid, ...rest } = data;
    const existing = await studentService.getStudentByUid(uid);
    if (existing) {
        const status = (existing as { approvalStatus?: string }).approvalStatus;
        if (status === "PENDING") {
            return { success: true, redirect: "/pending-approval", docId: uid };
        }
        return { success: true, redirect: `/student/${uid}`, docId: uid };
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
        docId: result.docId,
    };
}
