"use server";

import { parentService } from "@/services/parentService";
import { studentService } from "@/services/studentService";
import { revalidatePath } from "next/cache";

/**
 * 자녀 등록(연동): 학생 이름·학생 전화번호·학부모 전화번호로 students 문서 조회 후
 * 해당 학생 id를 현재 학부모의 studentIds에 추가.
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

    const existingIds = (parent.studentIds as number[] | undefined) ?? [];
    if (existingIds.includes(student.id)) {
        return { success: false, message: "이미 연동된 자녀입니다." };
    }

    const result = await parentService.addStudentIdToParent(parentUid, student.id);
    if (result.success) {
        revalidatePath("/parent/dashboard");
    }
    return result;
}

/** 연동된 자녀 목록 (id, name) */
export async function getLinkedStudentsForParent(parentUid: string): Promise<{ id: number; name: string }[]> {
    const parent = await parentService.getParentByUid(parentUid);
    const ids = (parent?.studentIds as number[] | undefined) ?? [];
    return studentService.getStudentsByIds(ids);
}
