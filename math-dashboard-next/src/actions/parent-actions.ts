"use server";

import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth";
import { parentService } from "@/services/parentService";
import { studentService } from "@/services/studentService";
import { revalidatePath } from "next/cache";

/**
 * 자녀 등록 요청: 학생 이름·전화·학부모 전화가 일치하면 연동 요청을 생성.
 * 학생이 승인해야 실제 연동(studentIds에 추가)됨.
 */
export async function linkChildToParent(
    parentUid: string,
    data: { studentName: string; studentPhone: string; parentPhone: string }
): Promise<{ success: true } | { success: false; message: string }> {
    const { studentName, studentPhone, parentPhone } = data;
    if (!studentName?.trim() || !studentPhone?.trim() || !parentPhone?.trim()) {
        return { success: false, message: "학생 이름, 학생 전화번호, 학부모 전화번호를 모두 입력해 주세요." };
    }

    const student = await parentService.findStudentByNameAndPhones(studentName.trim(), studentPhone.trim(), parentPhone.trim());
    if (!student) {
        return { success: false, message: "일치하는 학생을 찾을 수 없습니다. 이름·학생 전화번호·학부모 전화번호를 확인해 주세요." };
    }

    const parent = await parentService.getParentByUid(parentUid);
    if (!parent) {
        return { success: false, message: "학부모 정보를 찾을 수 없습니다." };
    }

    const existingIds = (parent.studentIds as string[] | undefined) ?? [];
    if (existingIds.includes(student.docId)) {
        return { success: false, message: "이미 연동된 자녀입니다." };
    }

    const parentName = (parent.name as string) || "학부모";
    const result = await parentService.createLinkRequest({
        parentUid,
        parentName,
        studentDocId: student.docId,
        studentName: student.name,
    });

    if (result.success) {
        revalidatePath(`/parent/${parentUid}/dashboard`);
    }
    return result;
}

export async function getLinkedStudentsForParent(parentUid: string): Promise<{ name: string; docId: string }[]> {
    const parent = await parentService.getParentByUid(parentUid);
    const docIds = (parent?.studentIds as string[] | undefined) ?? [];
    if (docIds.length === 0) return [];
    return studentService.getStudentsByDocIds(docIds);
}

/** 학부모 쪽: 보낸 연동 요청 대기 목록. */
export async function getSentPendingRequests(parentUid: string): Promise<
    { linkId: string; studentDocId: string; studentName: string; requestedAt: string }[]
> {
    return parentService.getPendingRequestsByParent(parentUid);
}

/** 학생 쪽: 나와 연동된 학부모 목록 (studentIds에 포함된 학부모 전체). 전화번호·로그인 기록 포함. */
export async function getConnectedParentsForStudent(studentDocId: string): Promise<{ uid: string; name: string; phoneNumber?: string; loginHistory?: string[] }[]> {
    if (!studentDocId) return [];
    return parentService.getParentsLinkedToStudent(studentDocId);
}

/** 학생이 본인 계정에 연결된 학부모와 연동 해제. 본인(학생)만 요청 가능. */
export async function unlinkParentFromStudent(
    studentDocId: string,
    parentUid: string
): Promise<{ success: true } | { success: false; message: string }> {
    const session = await getServerSession(getAuthOptions(undefined));
    const uid = (session?.user as { sub?: string })?.sub ?? (session?.user as { id?: string })?.id;
    if (!uid) return { success: false, message: "로그인이 필요합니다." };
    if (uid !== studentDocId) return { success: false, message: "본인 계정에 연결된 학부모만 해제할 수 있습니다." };

    const result = await parentService.removeStudentDocIdFromParent(parentUid, studentDocId);
    if (result.success) {
        revalidatePath("/");
        revalidatePath(`/student/${studentDocId}/links`);
    }
    return result;
}

/** 학부모가 본인 계정에 연결된 자녀(학생)와 연동 해제. 본인(학부모)만 요청 가능. */
export async function unlinkStudentFromParent(
    parentUid: string,
    studentDocId: string
): Promise<{ success: true } | { success: false; message: string }> {
    const session = await getServerSession(getAuthOptions(undefined));
    const uid = (session?.user as { sub?: string })?.sub ?? (session?.user as { id?: string })?.id;
    if (!uid) return { success: false, message: "로그인이 필요합니다." };
    if (uid !== parentUid) return { success: false, message: "본인 계정에 연결된 자녀만 해제할 수 있습니다." };

    const result = await parentService.removeStudentDocIdFromParent(parentUid, studentDocId);
    if (result.success) {
        revalidatePath("/");
        revalidatePath(`/parent/${parentUid}/dashboard`);
    }
    return result;
}

/** 학생 쪽: 나에게 온 학부모 연동 승인 대기 목록. */
export async function getPendingParentRequests(studentDocId: string): Promise<
    { linkId: string; parentUid: string; parentName: string; requestedAt: string }[]
> {
    return parentService.getPendingRequestsByStudent(studentDocId);
}

/** 학생이 학부모 연동 요청을 수락. */
export async function acceptParentLinkRequest(
    routeStudentDocId: string,
    linkId: string
): Promise<{ success: true } | { success: false; message: string }> {
    const session = await getServerSession(getAuthOptions(undefined));
    const uid = (session?.user as { sub?: string })?.sub ?? (session?.user as { id?: string })?.id;
    if (!uid) {
        console.error("[acceptParentLinkRequest] No session uid");
        return { success: false, message: "로그인이 필요합니다." };
    }

    const linkDoc = await parentService.getLinkRequestById(linkId);
    if (!linkDoc) {
        console.error("[acceptParentLinkRequest] Link request not found:", linkId);
        return { success: false, message: "요청을 찾을 수 없습니다." };
    }

    if (uid !== linkDoc.studentDocId && routeStudentDocId !== linkDoc.studentDocId) {
        console.error("[acceptParentLinkRequest] UID mismatch:", { uid, routeStudentDocId, linkStudentDocId: linkDoc.studentDocId });
        return { success: false, message: "본인에게 온 요청만 승인할 수 있습니다." };
    }

    const result = await parentService.acceptLinkRequest(linkId);
    if (result.success) {
        revalidatePath(`/student/${routeStudentDocId}/links`);
        revalidatePath(`/parent/${result.parentUid}/dashboard`);
    }
    return result;
}

/** 학생이 학부모 연동 요청을 거절. */
export async function rejectParentLinkRequest(
    routeStudentDocId: string,
    linkId: string
): Promise<{ success: true } | { success: false; message: string }> {
    const session = await getServerSession(getAuthOptions(undefined));
    const uid = (session?.user as { sub?: string })?.sub ?? (session?.user as { id?: string })?.id;
    if (!uid) {
        console.error("[rejectParentLinkRequest] No session uid");
        return { success: false, message: "로그인이 필요합니다." };
    }

    const linkDoc = await parentService.getLinkRequestById(linkId);
    if (!linkDoc) {
        console.error("[rejectParentLinkRequest] Link request not found:", linkId);
        return { success: false, message: "요청을 찾을 수 없습니다." };
    }

    if (uid !== linkDoc.studentDocId && routeStudentDocId !== linkDoc.studentDocId) {
        console.error("[rejectParentLinkRequest] UID mismatch:", { uid, routeStudentDocId, linkStudentDocId: linkDoc.studentDocId });
        return { success: false, message: "본인에게 온 요청만 거절할 수 있습니다." };
    }

    const result = await parentService.rejectLinkRequest(linkId);
    if (result.success) {
        revalidatePath(`/student/${routeStudentDocId}/links`);
    }
    return result;
}

/** 학부모가 보낸 연동 요청 취소 (pending 상태인 요청만 삭제 가능). */
export async function cancelLinkRequest(
    parentUid: string,
    linkId: string
): Promise<{ success: true } | { success: false; message: string }> {
    const session = await getServerSession(getAuthOptions(undefined));
    const uid = (session?.user as { sub?: string })?.sub ?? (session?.user as { id?: string })?.id;
    if (!uid) return { success: false, message: "로그인이 필요합니다." };
    if (uid !== parentUid) return { success: false, message: "본인의 요청만 취소할 수 있습니다." };

    const linkDoc = await parentService.getLinkRequestById(linkId);
    if (!linkDoc) return { success: false, message: "요청을 찾을 수 없습니다." };
    if (linkDoc.parentUid !== parentUid) return { success: false, message: "본인의 요청만 취소할 수 있습니다." };

    const result = await parentService.rejectLinkRequest(linkId);
    if (result.success) {
        revalidatePath(`/parent/${parentUid}/dashboard`);
    }
    return result;
}

/** 학부모 회원 탈퇴: parents 문서 삭제 + 연동된 studentIds 정리. */
export async function withdrawParentAccount(
    parentUid: string
): Promise<{ success: boolean; message?: string }> {
    const session = await getServerSession(getAuthOptions(undefined));
    const uid = (session?.user as { sub?: string })?.sub ?? (session?.user as { id?: string })?.id;
    if (!uid) return { success: false, message: "로그인이 필요합니다." };
    if (uid !== parentUid) return { success: false, message: "본인 계정만 탈퇴할 수 있습니다." };

    const result = await parentService.deleteParent(parentUid);
    if (result.success) revalidatePath("/");
    return result;
}

export async function getParentsWithLinkedStudents(): Promise<
    { uid: string; name: string; email?: string; linkedStudents: { name: string; docId: string }[] }[]
> {
    const parents = await parentService.getAllParents();
    const result: { uid: string; name: string; email?: string; linkedStudents: { name: string; docId: string }[] }[] = [];
    for (const p of parents) {
        const linkedStudents = await getLinkedStudentsForParent(p.uid);
        result.push({
            uid: p.uid,
            name: p.name,
            email: p.email as string | undefined,
            linkedStudents,
        });
    }
    return result;
}
