"use server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

/*
 * Get all students (User role = 'student')
 * Join with StudentProfile
 */
export async function getStudents() {
    try {
        const students = await db.user.findMany({
            where: {
                role: "student",
            },
            include: {
                profile: true,
                units: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        // Map to easier structure for UI if needed, or return as is.
        // Matching the UI's expected 'Student' type partially
        // Calculate progress for each student
        return students.map((s) => {
            const totalUnits = s.units.length;
            const completedWeight = s.units.filter(u => u.completionStatus === 'completed').length;
            const inProgressWeight = s.units.filter(u => u.completionStatus === 'in-progress').length * 0.5;
            const progress = totalUnits > 0 ? Math.round(((completedWeight + inProgressWeight) / totalUnits) * 100) : 0;

            return {
                id: s.id,
                name: s.name,
                loginId: s.loginId,
                grade: s.profile?.grade || "미정",
                class: s.profile?.class || "",
                phone: s.profile?.phone || "",
                email: s.profile?.email || "",
                statusSummary: s.profile?.statusSummary || "신규",
                progress,
                isActive: s.isActive,
                createdAt: s.createdAt,
                parentPhone: s.profile?.parentPhone || "",
                parentRelation: s.profile?.parentRelation || ""
            };
        });
    } catch (error) {
        console.error("Failed to fetch students:", error);
        return [];
    }
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
}

export async function createStudent(data: CreateStudentData) {
    try {
        // 1. Check duplicate ID
        const existing = await db.user.findUnique({
            where: {
                loginId: data.loginId,
            },
        });

        if (existing) {
            return { success: false, message: "이미 사용 중인 아이디입니다." };
        }

        // 2. Create User transactionally with Profile
        await db.$transaction(async (tx) => {
            const newUser = await tx.user.create({
                data: {
                    name: data.name,
                    loginId: data.loginId,
                    password: data.password, // In prod, hash this!
                    role: "student",
                },
            });

            await tx.studentProfile.create({
                data: {
                    userId: newUser.id,
                    grade: data.grade,
                    phone: data.phone,
                    email: data.email,
                    parentPhone: data.parentPhone,
                    parentRelation: data.parentRelation,
                    statusSummary: "신규",
                },
            });
        });

        revalidatePath("/admin/students");
        return { success: true };
    } catch (error) {
        console.error("Create student error:", error);
        return { success: false, message: "학생 등록 중 오류가 발생했습니다." };
    }
}

export async function updateStudentStatus(userId: number, isActive: boolean) {
    try {
        await db.user.update({
            where: { id: userId },
            data: { isActive }
        });
        revalidatePath("/admin/students");
        return { success: true };
    } catch (error) {
        console.error("Update status error:", error);
        return { success: false, message: "상태 변경 중 오류가 발생했습니다." };
    }
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
}

export async function updateStudent(userId: number, data: UpdateStudentData) {
    try {
        // Check for empty required fields
        if (!data.name || !data.loginId) {
            return { success: false, message: "이름과 아이디는 필수 항목입니다." };
        }

        // Check if loginId is changed and unique
        if (data.loginId) {
            const existing = await db.user.findFirst({
                where: {
                    loginId: data.loginId,
                    NOT: { id: userId }
                }
            });
            if (existing) {
                return { success: false, message: "이미 사용 중인 아이디입니다." };
            }
        }

        await db.$transaction(async (tx) => {
            const updateData: any = {
                name: data.name,
                loginId: data.loginId,
            };
            if (data.password && data.password.trim() !== "") {
                updateData.password = data.password;
            }

            await tx.user.update({
                where: { id: userId },
                data: updateData
            });

            await tx.studentProfile.upsert({
                where: { userId },
                create: {
                    userId,
                    grade: data.grade,
                    phone: data.phone,
                    email: data.email,
                    parentPhone: data.parentPhone,
                    parentRelation: data.parentRelation,
                    statusSummary: "신규"
                },
                update: {
                    grade: data.grade,
                    phone: data.phone,
                    email: data.email,
                    parentPhone: data.parentPhone,
                    parentRelation: data.parentRelation,
                    statusSummary: "수정됨"
                }
            });
        });

        revalidatePath("/admin/students");
        return { success: true };
    } catch (error: any) {
        console.error("Update student error:", error);
        return { success: false, message: error.message || "학생 정보 수정 중 오류가 발생했습니다." };
    }
}

export async function getStudentDetail(userId: number) {
    try {
        const student = await db.user.findUnique({
            where: { id: userId },
            include: {
                profile: true,
                units: {
                    orderBy: { id: 'desc' }
                },
                learningRecords: {
                    orderBy: { date: 'desc' }
                },
                schedules: {
                    orderBy: [
                        { date: 'desc' },
                        { startTime: 'desc' }
                    ]
                },
                homeworks: {
                    orderBy: { id: 'desc' }
                },
                exams: {
                    orderBy: { date: 'desc' }
                },
            }
        });

        if (!student) return null;

        const totalUnits = student.units.length;
        const completedWeight = student.units.filter(u => u.completionStatus === 'completed').length;
        const inProgressWeight = student.units.filter(u => u.completionStatus === 'in-progress').length * 0.5;
        const progress = totalUnits > 0 ? Math.round(((completedWeight + inProgressWeight) / totalUnits) * 100) : 0;

        return {
            ...student,
            grade: student.profile?.grade || "미정",
            phone: student.profile?.phone || "",
            email: student.profile?.email || "",
            parentPhone: student.profile?.parentPhone || "",
            parentRelation: student.profile?.parentRelation || "",
            progress
        };
    } catch (error) {
        console.error("Failed to fetch student detail:", error);
        return null;
    }
}

export async function getStudentIncorrectNotes(userId: number) {
    try {
        const notes = await db.incorrectNote.findMany({
            where: { userId },
            include: {
                unit: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        return notes;
    } catch (error) {
        console.error("Failed to fetch incorrect notes:", error);
        return [];
    }
}
