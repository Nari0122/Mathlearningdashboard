"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

// --- Units ---

export async function getUnits(userId: number) {
    try {
        const units = await db.unit.findMany({
            where: { userId },
            orderBy: { id: 'desc' }
        });

        return units.map(u => ({
            id: u.id,
            name: u.name,
            grade: u.grade,
            subject: u.subject,
            status: u.status as 'HIGH' | 'MID' | 'LOW',
            selectedDifficulty: u.selectedDifficulty,
            completionStatus: u.completionStatus as 'incomplete' | 'in-progress' | 'completed',
            errors: {
                C: u.errorC,
                M: u.errorM,
                R: u.errorR,
                S: u.errorS
            }
        }));
    } catch (error) {
        console.error("Failed to fetch units:", error);
        return [];
    }
}

export async function addUnit(userId: number, name: string, grade: string) {
    try {
        await db.unit.create({
            data: {
                userId,
                name,
                grade,
                status: "MID",
                selectedDifficulty: "중",
                completionStatus: "incomplete",
                errorC: 0,
                errorM: 0,
                errorR: 0,
                errorS: 0
            }
        });
        revalidatePath("/study/my-learning");
        revalidatePath("/dashboard");
        return { success: true };
    } catch (error) {
        console.error("Failed to add unit:", error);
        return { success: false, error: "Failed to add unit" };
    }
}

export async function updateUnitName(unitId: number, name: string) {
    try {
        await db.unit.update({
            where: { id: unitId },
            data: { name }
        });
        revalidatePath("/study/my-learning");
        return { success: true };
    } catch (error) {
        return { success: false };
    }
}

export async function updateUnitDetails(unitId: number, name: string, grade: string) {
    try {
        await db.unit.update({
            where: { id: unitId },
            data: { name, grade }
        });
        revalidatePath("/study/my-learning");
        return { success: true };
    } catch (error) {
        return { success: false };
    }
}


export async function updateUnitDifficulty(unitId: number, difficulty: string) {
    try {
        await db.unit.update({
            where: { id: unitId },
            data: { selectedDifficulty: difficulty }
        });
        revalidatePath("/study/my-learning");
        revalidatePath("/dashboard");
        return { success: true };
    } catch (error) {
        return { success: false };
    }
}

export async function updateUnitStatus(unitId: number, status: string) { // Admin System Status
    try {
        await db.unit.update({
            where: { id: unitId },
            data: { status }
        });
        revalidatePath("/study/my-learning");
        return { success: true };
    } catch (error) {
        return { success: false };
    }
}

export async function updateCompletionStatus(unitId: number, status: string) {
    try {
        await db.unit.update({
            where: { id: unitId },
            data: { completionStatus: status }
        });
        revalidatePath("/study/my-learning");
        revalidatePath("/dashboard");
        return { success: true };
    } catch (error) {
        return { success: false };
    }
}

export async function deleteUnit(unitId: number) {
    try {
        await db.unit.delete({ where: { id: unitId } });
        revalidatePath("/study/my-learning");
        revalidatePath("/dashboard");
        return { success: true };
    } catch (error) {
        return { success: false };
    }
}

export async function updateUnitError(unitId: number, type: 'C' | 'M' | 'R' | 'S', delta: number) {
    try {
        const unit = await db.unit.findUnique({ where: { id: unitId } });
        if (!unit) throw new Error("Unit not found");

        const field = `error${type}`;
        // @ts-ignore
        const currentVal = unit[field];
        const newVal = Math.min(99, Math.max(0, currentVal + delta));

        await db.unit.update({
            where: { id: unitId },
            data: { [field]: newVal }
        });
        revalidatePath("/study/my-learning");
        revalidatePath("/dashboard");
        return { success: true };
    } catch (error) {
        return { success: false };
    }
}
