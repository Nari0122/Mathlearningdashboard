"use server";

import { learningService } from "@/services/learningService";
import { revalidatePath } from "next/cache";

// --- Units ---

export async function getUnits(docId: string) {
    try {
        const units = await learningService.getUnits(docId);

        return units.map((u: any) => ({
            id: u.id,
            name: u.name,
            unitName: u.unitName, // Correctly map unitName from service
            schoolLevel: u.schoolLevel || '고등', // Default or from DB
            grade: u.grade,
            subject: u.subject || '수학', // Default subject
            unitDetails: u.unitDetails || [],
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

export async function addUnit(docId: string, name: string, grade: string) {
    try {
        const result = await learningService.createUnit(docId, {
            name,
            grade,
            status: "MID",
            selectedDifficulty: "중",
            subject: "수학" // Default subject
        });

        if (result.success) {
            revalidatePath("/study/my-learning");
            revalidatePath("/dashboard");
            return { success: true };
        }
        return { success: false, error: result.message };
    } catch (error) {
        console.error("Failed to add unit:", error);
        return { success: false, error: "Failed to add unit" };
    }
}

export async function updateUnitName(unitId: number, name: string) {
    try {
        const found = await learningService.findUnitRefGlobally(unitId);
        if (!found) return { success: false };

        await found.unitRef.update({ name });
        revalidatePath("/study/my-learning");
        return { success: true };
    } catch (error) {
        return { success: false };
    }
}

export async function updateUnitDetails(unitId: number, name: string, grade: string) {
    try {
        const found = await learningService.findUnitRefGlobally(unitId);
        if (!found) return { success: false };

        await found.unitRef.update({ name, grade });
        revalidatePath("/study/my-learning");
        return { success: true };
    } catch (error) {
        return { success: false };
    }
}

export async function updateUnitDifficulty(unitId: number, difficulty: string) {
    try {
        const found = await learningService.findUnitRefGlobally(unitId);
        if (!found) return { success: false };

        await found.unitRef.update({ selectedDifficulty: difficulty });
        revalidatePath("/study/my-learning");
        revalidatePath("/dashboard");
        return { success: true };
    } catch (error) {
        return { success: false };
    }
}

export async function updateUnitStatus(unitId: number, status: string) {
    try {
        const found = await learningService.findUnitRefGlobally(unitId);
        if (!found) return { success: false };

        await found.unitRef.update({ status });
        revalidatePath("/study/my-learning");
        return { success: true };
    } catch (error) {
        return { success: false };
    }
}

export async function updateCompletionStatus(unitId: number, status: string) {
    try {
        const found = await learningService.findUnitRefGlobally(unitId);
        if (!found) return { success: false };

        await found.unitRef.update({ completionStatus: status });
        revalidatePath("/study/my-learning");
        revalidatePath("/dashboard");
        return { success: true };
    } catch (error) {
        return { success: false };
    }
}

export async function deleteUnit(unitId: number) {
    try {
        const found = await learningService.findUnitRefGlobally(unitId);
        if (!found) return { success: false };

        await found.unitRef.delete();
        revalidatePath("/study/my-learning");
        revalidatePath("/dashboard");
        return { success: true };
    } catch (error) {
        return { success: false };
    }
}

export async function updateUnitError(unitId: number, type: 'C' | 'M' | 'R' | 'S', delta: number) {
    try {
        const found = await learningService.findUnitRefGlobally(unitId);
        if (!found) return { success: false };

        const doc = await found.unitRef.get();
        const data = doc.data() || {};
        const field = `error${type}`;
        const currentVal = data[field] || 0;
        const newVal = Math.min(99, Math.max(0, currentVal + delta));

        await found.unitRef.update({ [field]: newVal });
        revalidatePath("/study/my-learning");
        revalidatePath("/dashboard");
        return { success: true };
    } catch (error) {
        return { success: false };
    }
}
