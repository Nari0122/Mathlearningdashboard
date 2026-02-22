"use server";

import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth";
import { userService } from "@/services/userService";
import { checkExistingUserByUid } from "@/actions/signup-actions";
import { revalidatePath } from "next/cache";

/** Super Admin 전용: 관리자 목록 조회 */
export async function listAdminsAction() {
    const session = await getServerSession(getAuthOptions(undefined));
    const role = (session?.user as { role?: string })?.role;
    if (role !== "SUPER_ADMIN") return { success: false as const, message: "권한이 없습니다.", list: [] };
    const list = await userService.listAdmins();
    return { success: true as const, list };
}

/** Super Admin 전용: 관리자 승인/반려 */
export async function updateAdminStatusAction(uid: string, status: "PENDING" | "APPROVED") {
    const session = await getServerSession(getAuthOptions(undefined));
    const role = (session?.user as { role?: string })?.role;
    if (role !== "SUPER_ADMIN") return { success: false, message: "권한이 없습니다." };
    const result = await userService.updateAdminStatus(uid, status);
    if (result.success) revalidatePath("/admin/admins");
    return result;
}

/** Super Admin 전용: 관리자 계정 삭제 (SUPER_ADMIN 제외) */
export async function deleteAdminAction(uid: string) {
    const session = await getServerSession(getAuthOptions(undefined));
    const role = (session?.user as { role?: string })?.role;
    if (role !== "SUPER_ADMIN") return { success: false, message: "권한이 없습니다." };
    const result = await userService.deleteAdmin(uid);
    if (result.success) revalidatePath("/admin/admins");
    return result;
}

/** 비공개 URL /admin-login 전용: 관리자 가입 (role=ADMIN, status=PENDING) */
export async function createAdminAction(data: {
    username: string;
    password: string;
    name: string;
    phoneNumber: string;
}) {
    return userService.createAdmin(data);
}

/** 카카오 로그인 후 관리자 계정 신청: students/parents/admins 전체 조회 후 없을 때만 admins에 문서 추가. 역할 격리 적용. */
export async function createAdminWithKakaoAction(uid: string, name: string, phoneNumber: string) {
    const existing = await checkExistingUserByUid(uid);
    if (existing.kind === "student" || existing.kind === "parent") {
        return { success: false, message: "이미 학생/학부모로 등록된 계정입니다. 해당 화면에서 로그인해 주세요." };
    }
    if (existing.kind === "admin") {
        return { success: false, message: "이미 가입된 계정입니다." };
    }
    return userService.createAdminWithKakao(uid, name, phoneNumber);
}
