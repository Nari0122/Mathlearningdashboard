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
    password: string;
    grade: string;
    phone: string;
    email?: string;
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

export interface UpdateStudentData {
    name: string;
    loginId: string;
    password?: string;
    grade: string;
    phone: string;
    email?: string;
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

export async function getStudentIncorrectNotes(userId: number) {
    // To be implemented in learningService/studentService
    return [];
}

// Submit homework
export async function submitHomework(homeworkId: string, studentId: number) {
    try {
        // Import admin service since homework is managed there
        const { learningService } = await import("@/services/learningService");

        // Get homework to check due date
        const homeworks = await learningService.getAssignments(studentId);
        const homework = homeworks.find((h: any) => h.id === homeworkId) as any;

        if (!homework) {
            return { success: false, error: "숙제를 찾을 수 없습니다." };
        }

        const now = new Date();
        const dueDate = new Date(homework.dueDate);
        const isLate = now > dueDate;

        // Use updateHomework from admin-actions
        const { updateHomework } = await import("@/actions/admin-actions");
        const result = await updateHomework(homeworkId, studentId, {
            title: homework.title,
            dueDate: homework.dueDate,
            status: isLate ? 'late-submitted' : 'submitted',
            submittedDate: now.toISOString().split('T')[0]
        });

        if (result.success) {
            revalidatePath(`/student/${studentId}/homework`);
        }

        return result;
    } catch (error) {
        console.error("submitHomework error:", error);
        return { success: false, error: "숙제 제출 실패" };
    }
}
