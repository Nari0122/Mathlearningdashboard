import { adminDb } from "@/lib/firebase-admin";
import { Student } from "@/types";

// Internal helper to find Firestore document ID by numeric ID field
async function getDocIdByNumericId(collection: string, numericId: number) {
    const snapshot = await adminDb.collection(collection).where("id", "==", numericId).limit(1).get();
    if (snapshot.empty) return null;
    return snapshot.docs[0].id;
}

// Internal helper to get next available numeric ID
async function getNextNumericId(collection: string) {
    const snapshot = await adminDb.collection(collection).orderBy("id", "desc").limit(1).get();
    if (snapshot.empty) return 1;
    const data = snapshot.docs[0].data();
    return (data.id || 0) + 1;
}

export const studentService = {
    async getStudents() {
        try {
            const snapshot = await adminDb.collection("students").orderBy("createdAt", "desc").get();
            return snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    ...data,
                    createdAt: data.createdAt
                };
            });
        } catch (error) {
            console.error("Firestore getStudents error:", error);
            return [];
        }
    },

    async getStudentDetail(id: number) {
        try {
            const snapshot = await adminDb.collection("students").where("id", "==", id).limit(1).get();
            if (snapshot.empty) return null;

            const doc = snapshot.docs[0];
            const studentData = doc.data() as Student;

            // Fetch sub-collections for detail view using document reference
            const unitsSnapshot = await doc.ref.collection("units").orderBy("createdAt", "desc").get();
            const units = unitsSnapshot.docs.map(u => ({ ...u.data() }));

            return {
                ...studentData,
                units
            };
        } catch (error) {
            console.error("Firestore getStudentDetail error:", error);
            return null;
        }
    },

    async createStudent(data: any) {
        try {
            const nextId = await getNextNumericId("students");
            await adminDb.collection("students").add({
                ...data,
                id: nextId,
                createdAt: new Date().toISOString(),
                isActive: true,
            });
            return { success: true };
        } catch (error) {
            console.error("Firestore createStudent error:", error);
            return { success: false, message: "Failed to create student" };
        }
    },

    async updateStudent(id: number, data: any) {
        try {
            const docId = await getDocIdByNumericId("students", id);
            if (!docId) return { success: false, message: "Student not found" };

            await adminDb.collection("students").doc(docId).update(data);
            return { success: true };
        } catch (error) {
            console.error("Firestore updateStudent error:", error);
            return { success: false, message: "Failed to update student" };
        }
    },

    async getDashboardStats(id: number) {
        try {
            // 1. Get Student Data (Login History)
            const studentSnapshot = await adminDb.collection("students").where("id", "==", id).limit(1).get();
            if (studentSnapshot.empty) return null;
            const studentData = studentSnapshot.docs[0].data();

            // 2. Get Schedules
            const { learningService } = await import("./learningService");
            const schedules = await learningService.getSchedules(id);

            // 3. Calculate Stats
            // Monthly Login Count
            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();
            const loginHistory = (studentData.loginHistory || []) as string[];
            const monthlyLoginCount = loginHistory.filter(dateStr => {
                const date = new Date(dateStr);
                return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
            }).length;

            // Next Class
            // Filter assuming date format YYYY-MM-DD and startTime HH:mm
            // Robust parsing needed if formats vary, assuming ISO or comparable string for now
            const upcomingSchedules = schedules
                .filter((s: any) => {
                    const scheduleDateTime = new Date(`${s.date}T${s.startTime}`);
                    return scheduleDateTime > now;
                })
                .sort((a: any, b: any) => {
                    const dateA = new Date(`${a.date}T${a.startTime}`);
                    const dateB = new Date(`${b.date}T${b.startTime}`);
                    return dateA.getTime() - dateB.getTime();
                });
            const nextClass = upcomingSchedules.length > 0 ? upcomingSchedules[0] : null;

            // Persistence Rate (Example: (Completed Units / Total Units) * 100)
            const units = await learningService.getUnits(id);
            const totalUnits = units.length;
            const completedUnits = units.filter((u: any) => u.completionStatus === 'completed').length;
            const persistenceRate = totalUnits > 0 ? Math.round((completedUnits / totalUnits) * 100) : 0;

            return {
                recentLogin: studentData.lastLogin || null,
                monthlyLoginCount,
                nextClass,
                persistenceRate
            };

        } catch (error) {
            console.error("getDashboardStats error:", error);
            return null;
        }
    }
};
