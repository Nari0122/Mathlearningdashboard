"use server";
import { studentService } from "@/services/studentService";
import { revalidatePath } from "next/cache";

export async function getStudents() {
    return await studentService.getStudents();
}

interface CreateStudentData {
    name: string;
    loginId: string;
    grade: string;
    phone: string;
    parentPhone?: string;
    parentRelation?: string;
    enrollmentDate?: string;
    memo?: string;
    schoolName?: string;
    schoolType?: string;
    username?: string;
}

export async function createStudent(data: CreateStudentData) {
    const payload = {
        ...data,
        username: data.username || data.loginId
    };
    const result = await studentService.createStudent(payload);
    if (result.success) {
        revalidatePath("/admin/students");
    }
    return result;
}

export async function approveStudentByDocId(docId: string) {
    const result = await studentService.updateStudentByDocId(docId, { approvalStatus: "APPROVED" } as any);
    if (result.success) revalidatePath("/admin/students");
    return result;
}

export interface UpdateStudentData {
    name: string;
    loginId: string;
    grade: string;
    phone: string;
    email?: string;
    isActive?: boolean;
    password?: string;
    parentPhone?: string;
    parentRelation?: string;
    enrollmentDate?: string;
    memo?: string;
    schoolName?: string;
    schoolType?: string;
    username?: string;
}

export async function updateStudentByDocId(docId: string, data: UpdateStudentData) {
    const result = await studentService.updateStudentByDocId(docId, data);
    if (result.success) {
        revalidatePath("/admin/students");
        revalidatePath(`/admin/students/${docId}`);
    }
    return result;
}

export async function deleteStudentByDocId(docId: string) {
    const result = await studentService.deleteStudentByDocId(docId);
    if (result.success) revalidatePath("/admin/students");
    return result;
}

export async function getStudentDetailByDocId(docId: string) {
    return await studentService.getStudentDetailByDocId(docId);
}

export async function updateStudentStatusByDocId(docId: string, isActive: boolean) {
    const result = await studentService.updateStudentByDocId(docId, { isActive });
    if (result.success) revalidatePath("/admin/students");
    return result;
}

export async function submitHomework(homeworkId: string, studentDocId: string) {
    try {
        const { learningService } = await import("@/services/learningService");
        const { isSubmissionLocked, isLateSubmissionLocked } = await import("@/lib/submissionDeadline");
        const homeworks = await learningService.getAssignments(studentDocId);
        const homework = homeworks.find((h: any) => h.id === homeworkId) as any;

        if (!homework) {
            return { success: false, error: "숙제를 찾을 수 없습니다." };
        }

        if (isLateSubmissionLocked(homework)) {
            return { success: false, error: "지각 제출 기한이 지났습니다." };
        }

        const now = new Date();
        const today = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' });
        const nowInSeoul = new Date(
            now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' })
        );
        const isLate = today > homework.dueDate || isSubmissionLocked(homework);

        const { updateHomework } = await import("@/actions/admin-actions");
        const result = await updateHomework(homeworkId, studentDocId, {
            title: homework.title,
            dueDate: homework.dueDate,
            status: isLate ? 'late-submitted' : 'submitted',
            submittedDate: nowInSeoul.toISOString()
        });

        if (result.success) {
            revalidatePath(`/student/${studentDocId}/homework`);
        }

        return result;
    } catch (error) {
        console.error("submitHomework error:", error);
        return { success: false, error: "숙제 제출 실패" };
    }
}
