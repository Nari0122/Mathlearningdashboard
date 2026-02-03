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

export async function getStudentDetail(userId: number) {
    return await studentService.getStudentDetail(userId);
}

export async function getStudentIncorrectNotes(userId: number) {
    // To be implemented in learningService/studentService
    return [];
}
