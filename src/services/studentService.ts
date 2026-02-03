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

    async getDashboardStats(studentId: number) {
        try {
            const snapshot = await adminDb.collection("students").where("id", "==", studentId).limit(1).get();
            if (snapshot.empty) return null;

            const studentDoc = snapshot.docs[0];
            const studentData = studentDoc.data();

            // Calculate monthly login count from loginHistory
            const loginHistory = studentData.loginHistory || [];
            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();

            const monthlyLogins = loginHistory.filter((isoString: string) => {
                const date = new Date(isoString);
                return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
            });

            // Fetch next class from schedules sub-collection
            const todayStr = now.toISOString().split('T')[0];
            const schedulesSnapshot = await studentDoc.ref.collection("schedules")
                .where("date", ">=", todayStr)
                .orderBy("date", "asc")
                .limit(5)
                .get();

            let nextClass = null;
            if (!schedulesSnapshot.empty) {
                const schedules = schedulesSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
                // Sort by startTime in memory if dates are same
                schedules.sort((a: any, b: any) => {
                    if (a.date === b.date) {
                        return (a.startTime || "").localeCompare(b.startTime || "");
                    }
                    return 0; // Already sorted by date
                });
                nextClass = schedules[0];
            }

            return {
                recentLogin: studentData.lastLogin || null,
                nextClass: nextClass,
                monthlyLoginCount: monthlyLogins.length,
                persistenceRate: studentData.persistenceRate || 100,
            };
        } catch (error) {
            console.error("Firestore getDashboardStats error:", error);
            return {
                recentLogin: null,
                nextClass: null,
                monthlyLoginCount: 0,
                persistenceRate: 100,
            };
        }
    }
};
