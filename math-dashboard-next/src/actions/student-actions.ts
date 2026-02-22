"use server";
import { studentService } from "@/services/studentService";
import { revalidatePath } from "next/cache";

/*
 * Get all students (User role = 'student')
 */
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
    // Ensure username mirrors loginId if not provided
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

export async function updateStudentStatus(userId: number, isActive: boolean) {
    const result = await studentService.updateStudent(userId, { isActive });
    if (result.success) {
        revalidatePath("/admin/students");
    }
    return result;
}

/** 카카오/회원가입 학생 승인: PENDING → APPROVED */
export async function approveStudent(studentId: number) {
    const result = await studentService.updateStudent(studentId, { approvalStatus: "APPROVED" } as any);
    if (result.success) {
        revalidatePath("/admin/students");
    }
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

export async function updateStudent(userId: number, data: UpdateStudentData) {
    const result = await studentService.updateStudent(userId, data);
    if (result.success) {
        revalidatePath("/admin/students");
    }
    return result;
}

export async function deleteStudent(userId: number) {
    // Structural Admin Check (Placeholder - should be replaced with real session auth)
    // const session = await getSession(); if (!session || session.role !== 'admin') return { success: false, message: 'Unauthorized' };

    const result = await studentService.deleteStudent(userId);
    if (result.success) {
        revalidatePath("/admin/students");
    }
    return result;
}

export async function getStudentDetail(userId: number) {
    return await studentService.getStudentDetail(userId);
}

/** 문서 ID로 학생 상세 조회 (관리자 학생 상세 URL용) */
export async function getStudentDetailByDocId(docId: string) {
    return await studentService.getStudentDetailByDocId(docId);
}

/** 라우트 id(숫자 또는 docId) → Firestore 학생 문서 ID. 연동 관리 등에서 사용 */
export async function getStudentDocIdFromRouteId(routeId: string): Promise<string | null> {
    return await studentService.getStudentDocIdFromRouteId(routeId);
}

export async function updateStudentStatusByDocId(docId: string, isActive: boolean) {
    const result = await studentService.updateStudentByDocId(docId, { isActive });
    if (result.success) revalidatePath("/admin/students");
    return result;
}

export async function approveStudentByDocId(docId: string) {
    const result = await studentService.updateStudentByDocId(docId, { approvalStatus: "APPROVED" } as any);
    if (result.success) revalidatePath("/admin/students");
    return result;
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

export async function getStudentIncorrectNotes(userId: number) {
    // To be implemented in learningService/studentService
    return [];
}

// Submit homework (studentDocId = Firestore document ID, e.g. student uid)
export async function submitHomework(homeworkId: string, studentDocId: string) {
    try {
        const { learningService } = await import("@/services/learningService");
        const { isSubmissionLocked } = await import("@/lib/submissionDeadline");
        const homeworks = await learningService.getAssignments(studentDocId);
        const homework = homeworks.find((h: any) => h.id === homeworkId) as any;

        if (!homework) {
            return { success: false, error: "숙제를 찾을 수 없습니다." };
        }

        if (isSubmissionLocked(homework)) {
            return { success: false, error: "수업 준비를 위해 과제 제출이 마감되었습니다." };
        }

        const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' });
        const isLate = today > homework.dueDate;

        const { updateHomework } = await import("@/actions/admin-actions");
        const result = await updateHomework(homeworkId, studentDocId, {
            title: homework.title,
            dueDate: homework.dueDate,
            status: isLate ? 'late-submitted' : 'submitted',
            submittedDate: today
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
