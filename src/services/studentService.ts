import { adminDb } from "@/lib/firebase-admin";
import { Student } from "@/types";

// Internal helper to find Firestore document ID by numeric ID field
async function getDocRefByNumericId(collection: string, numericId: number) {
    const snapshot = await adminDb.collection(collection).where("id", "==", numericId).limit(1).get();
    if (snapshot.empty) return null;
    return snapshot.docs[0].ref;
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
                return { ...data, createdAt: data.createdAt };
            });
        } catch (error) {
            console.error("Firestore getStudents error:", error);
            return [];
        }
    },

    async getFirstStudent() {
        try {
            const snapshot = await adminDb.collection("students").where("status", "==", "active").limit(1).get();
            if (snapshot.empty) {
                // Fallback to any student if no active ones
                const fallback = await adminDb.collection("students").limit(1).get();
                if (fallback.empty) return null;
                return fallback.docs[0].data() as any;
            }
            return snapshot.docs[0].data() as any;
        } catch (error) {
            console.error("Firestore getFirstStudent error:", error);
            return null;
        }
    },

    /** 카카오 로그인: doc ID = 카카오 uid. 문서 존재 여부·approvalStatus 확인용 */
    async getStudentByUid(uid: string): Promise<{ id: number; [key: string]: unknown } | null> {
        try {
            const doc = await adminDb.collection("students").doc(uid).get();
            if (!doc.exists) return null;
            return doc.data() as { id: number; [key: string]: unknown };
        } catch (error) {
            console.error("Firestore getStudentByUid error:", error);
            return null;
        }
    },

    /** 카카오 회원가입 완료: doc ID = uid(카카오 uid), 추가정보 제출 시에만 호출 */
    async createStudentWithDocId(
        uid: string,
        data: Record<string, unknown>
    ): Promise<{ success: true; id: number } | { success: false; message: string }> {
        try {
            const nextId = await getNextNumericId("students");
            const approvalStatus = (data.approvalStatus as string) ?? "PENDING";
            const { approvalStatus: _, ...rest } = data;
            await adminDb.collection("students").doc(uid).set({
                ...rest,
                id: nextId,
                createdAt: new Date().toISOString(),
                isActive: true,
                approvalStatus,
            });
            return { success: true, id: nextId };
        } catch (error) {
            console.error("Firestore createStudentWithDocId error:", error);
            return { success: false, message: "Failed to create student" };
        }
    },

    /** 여러 학생 id에 대한 id·이름 목록 (자녀 목록 등) */
    async getStudentsByIds(ids: number[]): Promise<{ id: number; name: string }[]> {
        if (ids.length === 0) return [];
        try {
            const snapshot = await adminDb.collection("students").where("id", "in", ids.slice(0, 30)).get();
            return snapshot.docs.map(d => {
                const d_ = d.data();
                return { id: d_.id as number, name: (d_.name as string) || "" };
            });
        } catch (error) {
            console.error("Firestore getStudentsByIds error:", error);
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

    async createStudent(data: any): Promise<{ success: true; id: number } | { success: false; message: string }> {
        try {
            const nextId = await getNextNumericId("students");
            const approvalStatus = data.approvalStatus ?? "APPROVED"; // 카카오/회원가입은 "PENDING" 전달
            const { approvalStatus: _, ...rest } = data;
            await adminDb.collection("students").add({
                ...rest,
                id: nextId,
                createdAt: new Date().toISOString(),
                isActive: true,
                approvalStatus,
            });
            return { success: true, id: nextId };
        } catch (error) {
            console.error("Firestore createStudent error:", error);
            return { success: false, message: "Failed to create student" };
        }
    },

    async updateStudent(id: number, data: any) {
        try {
            const docRef = await getDocRefByNumericId("students", id);
            if (!docRef) return { success: false, message: "Student not found" };

            await docRef.update(data);
            return { success: true };
        } catch (error) {
            console.error("Firestore updateStudent error:", error);
            return { success: false, message: "Failed to update student" };
        }
    },

    async deleteStudent(id: number) {
        try {
            const docRef = await getDocRefByNumericId("students", id);
            if (!docRef) return { success: false, message: "Student not found" };

            // Note: In a production app, we might want to delete sub-collections too.
            // For now, we delete the main document as per the simple requirement.
            await docRef.delete();
            return { success: true };
        } catch (error) {
            console.error("Firestore deleteStudent error:", error);
            return { success: false, message: "Failed to delete student" };
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
