"use server";

import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth";
import { parentService } from "@/services/parentService";
import { studentService } from "@/services/studentService";
import { revalidatePath } from "next/cache";

/**
 * 자녀 등록(연동): 학생 이름·전화·학부모 전화가 일치하면 즉시 학부모의 studentIds에 추가.
 * 별도 승인 테이블 없이 parents 컬렉션만 사용.
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

    const existingIds = (parent.studentIds as (string | number)[] | undefined) ?? [];
    if (existingIds.includes(student.docId)) {
        return { success: false, message: "이미 연동된 자녀입니다." };
    }

    const result = await parentService.addStudentDocIdToParent(parentUid, student.docId);
    if (result.success) {
        revalidatePath(`/parent/${parentUid}/dashboard`);
    }
    return result;
}

/** 연동된 자녀 목록 (승인 완료된 것만). studentDocId 기준으로만 반환하도록 정규화 */
export async function getLinkedStudentsForParent(parentUid: string): Promise<{ id: number; name: string; docId: string }[]> {
    const parent = await parentService.getParentByUid(parentUid);
    const ids = (parent?.studentIds as (string | number)[] | undefined) ?? [];
    if (ids.length === 0) return [];
    const docIds = ids.filter((x): x is string => typeof x === "string");
    const numericIds = ids.filter((x): x is number => typeof x === "number");
    const [byDocId, byNumericId] = await Promise.all([
        docIds.length > 0 ? studentService.getStudentsByDocIds(docIds) : [],
        numericIds.length > 0 ? studentService.getStudentsByIds(numericIds) : [],
    ]);
    return [...byDocId, ...byNumericId];
}

/** 학부모 쪽: 보낸 연동 요청 대기 목록. 별도 링크 테이블 미사용으로 항상 빈 배열 반환. */
export async function getSentPendingRequests(_parentUid: string): Promise<
    { linkId: string; studentDocId: string; studentName: string; requestedAt: string }[]
> {
    return [];
}

/** 학생 쪽: 나와 연동된 학부모 목록 (studentIds에 포함된 학부모 전체). 전화번호 포함. */
export async function getConnectedParentsForStudent(studentDocId: string): Promise<{ uid: string; name: string; phoneNumber?: string }[]> {
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

/** 학생 쪽: 나에게 온 학부모 연동 승인 대기 목록. 별도 링크 테이블 미사용으로 항상 빈 배열 반환. */
export async function getPendingParentRequests(_studentDocId: string): Promise<
    { linkId: string; parentUid: string; parentName: string; requestedAt: string }[]
> {
    return [];
}

/** 관리자: 전체 학부모 목록 + 각 학부모의 연동된 자녀(학생) 목록. DB parents·students 연동 */
export async function getParentsWithLinkedStudents(): Promise<
    { uid: string; name: string; email?: string; linkedStudents: { id: number; name: string; docId: string }[] }[]
> {
    const parents = await parentService.getAllParents();
    const result: { uid: string; name: string; email?: string; linkedStudents: { id: number; name: string; docId: string }[] }[] = [];
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
