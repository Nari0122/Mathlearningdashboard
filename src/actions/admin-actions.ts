"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createUnit(studentId: number, data: { name: string; grade: string; subject: string; status: string; selectedDifficulty: string }) {
    try {
        console.log('Creating unit with data:', { studentId, ...data });
        await db.unit.create({
            data: {
                userId: studentId,
                name: data.name,
                grade: data.grade,
                subject: data.subject,
                status: data.status,
                selectedDifficulty: data.selectedDifficulty,
                completionStatus: "incomplete",
                errorC: 0, errorM: 0, errorR: 0, errorS: 0
            }
        });
        // Revalidate all related pages
        revalidatePath(`/admin/students/${studentId}/learning`);
        revalidatePath(`/study/my-learning`);
        revalidatePath(`/dashboard`);
        return { success: true };
    } catch (error: any) {
        console.error("Failed to create unit:", error);
        console.error("Error details:", error.message, error.stack);
        return { success: false, error: error.message || "Failed to create unit" };
    }
}

export async function createSchedule(studentId: number, data: { date: string; startTime: string; endTime: string; status: string; isRegular: boolean; dayOfWeek?: string; sessionNumber?: number }) {
    try {
        await db.schedule.create({
            data: {
                userId: studentId,
                date: data.date,
                startTime: data.startTime,
                endTime: data.endTime,
                status: data.status,
                isRegular: data.isRegular,
                dayOfWeek: data.dayOfWeek,
                sessionNumber: data.sessionNumber
            }
        });
        revalidatePath(`/admin/students/${studentId}/schedule`);
        return { success: true };
    } catch (error) {
        console.error("Failed to create schedule:", error);
        return { success: false, error: "Failed to create schedule" };
    }
}

export async function createHomework(studentId: number, data: { title: string; dueDate: string; assignedDate: string }) {
    try {
        await db.homework.create({
            data: {
                userId: studentId,
                title: data.title,
                dueDate: data.dueDate,
                assignedDate: data.assignedDate,
                status: "pending"
            }
        });
        revalidatePath(`/admin/students/${studentId}/homework`);
        return { success: true };
    } catch (error) {
        console.error("Failed to create homework:", error);
        return { success: false, error: "Failed to create homework" };
    }
}

export async function createExam(studentId: number, data: { examType: string; subject: string; date: string; score: number }) {
    try {
        await db.exam.create({
            data: {
                userId: studentId,
                examType: data.examType,
                subject: data.subject,
                date: data.date,
                score: data.score
            }
        });
        revalidatePath(`/admin/students/${studentId}/exams`);
        return { success: true };
    } catch (error) {
        console.error("Failed to create exam:", error);
        return { success: false, error: "Failed to create exam" };
    }
}

export async function createLearningRecord(studentId: number, data: { date: string; progress: string; comment: string }) {
    try {
        await db.learningRecord.create({
            data: {
                userId: studentId,
                date: data.date,
                progress: data.progress,
                comment: data.comment,
                createdBy: "admin"
            }
        });
        revalidatePath(`/admin/students/${studentId}/history`);
        return { success: true };
    } catch (error) {
        console.error("Failed to create learning record:", error);
        return { success: false, error: "Failed to create learning record" };
    }
}

export async function updateHomework(id: number, studentId: number, data: { title: string; dueDate: string }) {
    try {
        await db.homework.update({
            where: { id },
            data: { title: data.title, dueDate: data.dueDate }
        });
        revalidatePath(`/admin/students/${studentId}/homework`);
        return { success: true };
    } catch (e) { return { success: false, error: "Failed to update" }; }
}

export async function deleteHomework(id: number, studentId: number) {
    try {
        await db.homework.delete({ where: { id } });
        revalidatePath(`/admin/students/${studentId}/homework`);
        return { success: true };
    } catch (e) { return { success: false, error: "Failed to delete" }; }
}

export async function updateExam(id: number, studentId: number, data: { examType: string; subject: string; score: number; date: string }) {
    try {
        await db.exam.update({
            where: { id },
            data: { examType: data.examType, subject: data.subject, score: data.score, date: data.date }
        });
        revalidatePath(`/admin/students/${studentId}/exams`);
        return { success: true };
    } catch (e) { return { success: false, error: "Failed to update" }; }
}

export async function deleteExam(id: number, studentId: number) {
    try {
        await db.exam.delete({ where: { id } });
        revalidatePath(`/admin/students/${studentId}/exams`);
        return { success: true };
    } catch (e) { return { success: false, error: "Failed to delete" }; }
}

export async function updateLearningRecord(id: number, studentId: number, data: { date: string; progress: string; comment: string }) {
    try {
        await db.learningRecord.update({
            where: { id },
            data: { date: data.date, progress: data.progress, comment: data.comment }
        });
        revalidatePath(`/admin/students/${studentId}/history`);
        return { success: true };
    } catch (e) { return { success: false, error: "Failed to update" }; }
}

export async function deleteLearningRecord(id: number, studentId: number) {
    try {
        await db.learningRecord.delete({ where: { id } });
        revalidatePath(`/admin/students/${studentId}/history`);
        return { success: true };
    } catch (e) { return { success: false, error: "Failed to delete" }; }
}

export async function deleteSchedule(id: number, studentId: number) {
    try {
        await db.schedule.delete({ where: { id } });
        revalidatePath(`/admin/students/${studentId}/schedule`);
        return { success: true };
    } catch (e) { return { success: false, error: "Failed to delete" }; }
}

export async function updateUnit(
    id: number,
    studentId: number,
    data: {
        name?: string;
        grade?: string;
        subject?: string;
        status?: string;
        selectedDifficulty?: string;
        completionStatus?: string;
        errorC?: number;
        errorM?: number;
        errorR?: number;
        errorS?: number;
    }
) {
    try {
        await db.unit.update({
            where: { id },
            data: data
        });
        // Revalidate all related pages for proper synchronization
        revalidatePath(`/admin/students/${studentId}/learning`);
        revalidatePath(`/study/my-learning`);
        revalidatePath(`/dashboard`);
        return { success: true };
    } catch (e) { return { success: false, error: "Failed to update" }; }
}

export async function deleteUnit(id: number, studentId: number) {
    try {
        await db.unit.delete({ where: { id } });
        // Revalidate all related pages
        revalidatePath(`/admin/students/${studentId}/learning`);
        revalidatePath(`/study/my-learning`);
        revalidatePath(`/dashboard`);
        return { success: true };
    } catch (e) { return { success: false, error: "Failed to delete" }; }
}

export async function updateUnitError(
    unitId: number,
    studentId: number,
    errorType: 'C' | 'M' | 'R' | 'S',
    delta: number
) {
    try {
        // Fetch current unit to get the current error count
        const unit = await db.unit.findUnique({ where: { id: unitId } });
        if (!unit) return { success: false, error: "Unit not found" };

        const errorField = `error${errorType}` as 'errorC' | 'errorM' | 'errorR' | 'errorS';
        const currentCount = (unit as any)[errorField] || 0;
        const newCount = Math.min(99, Math.max(0, currentCount + delta));

        await db.unit.update({
            where: { id: unitId },
            data: { [errorField]: newCount }
        });

        // Revalidate all related pages
        revalidatePath(`/admin/students/${studentId}/learning`);
        revalidatePath(`/study/my-learning`);
        revalidatePath(`/dashboard`);

        return { success: true };
    } catch (e) {
        console.error("Failed to update unit error:", e);
        return { success: false, error: "Failed to update" };
    }
}
