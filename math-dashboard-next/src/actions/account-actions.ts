"use server";

import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth";
import { studentService } from "@/services/studentService";
import { userService } from "@/services/userService";
import { revalidatePath } from "next/cache";

/** 학생 본인 계정 비활성화. 로그인 차단, 데이터는 보존. docId = 세션 uid(카카오 등 문서 ID와 동일) */
export async function deactivateStudentAccount(docId: string): Promise<{ success: boolean; message?: string }> {
    const session = await getServerSession(getAuthOptions(undefined));
    const uid = (session?.user as { sub?: string })?.sub ?? (session?.user as { id?: string })?.id;
    if (!uid) return { success: false, message: "로그인이 필요합니다." };
    if (uid !== docId) return { success: false, message: "본인 계정만 비활성화할 수 있습니다." };

    const result = await studentService.updateStudentAccountStatusByDocId(docId, "INACTIVE");
    if (result.success) revalidatePath("/");
    return result;
}

/** 학생 회원 탈퇴: Firestore 학생 문서 삭제. 클라이언트에서 signOut 호출 필요 */
export async function withdrawStudentAccount(docId: string): Promise<{ success: boolean; message?: string }> {
    const session = await getServerSession(getAuthOptions(undefined));
    const uid = (session?.user as { sub?: string })?.sub ?? (session?.user as { id?: string })?.id;
    if (!uid) return { success: false, message: "로그인이 필요합니다." };
    if (uid !== docId) return { success: false, message: "본인 계정만 탈퇴할 수 있습니다." };

    const result = await studentService.deleteStudentByDocId(docId);
    if (result.success) revalidatePath("/");
    return result;
}

/** 관리자 수 (SUPER_ADMIN + APPROVED ADMIN). 최소 1명 유지용 */
export async function countApprovedAdmins(): Promise<number> {
    const list = await userService.listAdmins();
    return list.filter((a) => a.status === "APPROVED" || (a as { role?: string }).role === "SUPER_ADMIN").length;
}

/** 관리자 전용: 학생 계정 상태 변경(ACTIVE/INACTIVE). 로그인 차단 여부만 바꾸며 데이터는 보존. */
export async function updateStudentAccountStatusAdmin(
    docId: string,
    accountStatus: "ACTIVE" | "INACTIVE"
): Promise<{ success: boolean; message?: string }> {
    const session = await getServerSession(getAuthOptions(undefined));
    const uid = (session?.user as { sub?: string })?.sub ?? (session?.user as { id?: string })?.id;
    if (!uid) return { success: false, message: "로그인이 필요합니다." };
    const admin = await userService.getAdmin(uid);
    if (!admin || ((admin as { role?: string }).role !== "ADMIN" && (admin as { role?: string }).role !== "SUPER_ADMIN"))
        return { success: false, message: "관리자만 변경할 수 있습니다." };

    const result = await studentService.updateStudentAccountStatusByDocId(docId, accountStatus);
    if (result.success) revalidatePath("/");
    return result;
}

/** 관리자 본인 회원 탈퇴. 최소 1명의 관리자는 남겨야 함. */
export async function withdrawAdminAccount(uid: string): Promise<{ success: boolean; message?: string }> {
    const session = await getServerSession(getAuthOptions(undefined));
    const currentUid = (session?.user as { sub?: string })?.sub ?? (session?.user as { id?: string })?.id;
    if (!currentUid || currentUid !== uid) return { success: false, message: "본인 계정만 탈퇴할 수 있습니다." };

    const count = await countApprovedAdmins();
    if (count <= 1) return { success: false, message: "시스템 운영을 위해 최소 1명의 관리자가 필요합니다. 다른 관리자에게 탈퇴를 요청해 주세요." };

    const result = await userService.deleteAdmin(uid);
    if (result.success) revalidatePath("/");
    return result;
}
