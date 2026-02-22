import { adminDb } from "@/lib/firebase-admin";
import { Student } from "@/types";

// Internal helper to find Firestore document ID by numeric ID field
async function getDocRefByNumericId(collection: string, numericId: number) {
    if (!adminDb) return null;
    const snapshot = await adminDb.collection(collection).where("id", "==", numericId).limit(1).get();
    if (snapshot.empty) return null;
    return snapshot.docs[0].ref;
}

// Internal helper to get next available numeric ID
async function getNextNumericId(collection: string) {
    if (!adminDb) return 1;
    const snapshot = await adminDb.collection(collection).orderBy("id", "desc").limit(1).get();
    if (snapshot.empty) return 1;
    const data = snapshot.docs[0].data();
    return (data.id || 0) + 1;
}

export const studentService = {
    async getStudents() {
        if (!adminDb) return [];
        try {
            const snapshot = await adminDb.collection("students").orderBy("createdAt", "desc").get();
            return snapshot.docs.map(doc => {
                const data = doc.data();
                return { ...data, docId: doc.id, createdAt: data.createdAt };
            });
        } catch (error) {
            console.error("Firestore getStudents error:", error);
            return [];
        }
    },

    async getFirstStudent() {
        if (!adminDb) return null;
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

    /** 카카오 로그인: doc ID = 카카오 uid. 문서 존재 여부·approvalStatus·accountStatus 확인용 */
    async getStudentByUid(uid: string): Promise<{ id: number; docId?: string; accountStatus?: string; [key: string]: unknown } | null> {
        if (!adminDb) return null;
        try {
            const doc = await adminDb.collection("students").doc(uid).get();
            if (!doc.exists) return null;
            const data = doc.data() as { id: number; accountStatus?: string; [key: string]: unknown };
            return { ...data, docId: doc.id, accountStatus: data.accountStatus ?? "ACTIVE" };
        } catch (error) {
            console.error("Firestore getStudentByUid error:", error);
            return null;
        }
    },

    /** 학생 계정 상태 변경 (ACTIVE / INACTIVE). 비활성화 시 로그인 차단, 데이터는 보존 */
    async updateStudentAccountStatusByDocId(docId: string, accountStatus: "ACTIVE" | "INACTIVE") {
        if (!adminDb || !docId) return { success: false, message: "Database not available" };
        try {
            const docRef = adminDb.collection("students").doc(docId);
            const doc = await docRef.get();
            if (!doc.exists) return { success: false, message: "학생을 찾을 수 없습니다." };
            await docRef.update({ accountStatus });
            return { success: true };
        } catch (error) {
            console.error("Firestore updateStudentAccountStatusByDocId error:", error);
            return { success: false, message: "처리 중 오류가 발생했습니다." };
        }
    },

    /** 카카오 회원가입 완료: doc ID = uid(카카오 uid), 추가정보 제출 시에만 호출 */
    async createStudentWithDocId(
        uid: string,
        data: Record<string, unknown>
    ): Promise<{ success: true; id: number } | { success: false; message: string }> {
        if (!adminDb) return { success: false, message: "Database not available" };
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
                accountStatus: "ACTIVE",
            });
            return { success: true, id: nextId };
        } catch (error) {
            console.error("Firestore createStudentWithDocId error:", error);
            return { success: false, message: "Failed to create student" };
        }
    },

    /** 여러 학생 id에 대한 id·이름·docId 목록 (자녀 목록 등) */
    async getStudentsByIds(ids: number[]): Promise<{ id: number; name: string; docId: string }[]> {
        if (ids.length === 0 || !adminDb) return [];
        try {
            const snapshot = await adminDb.collection("students").where("id", "in", ids.slice(0, 30)).get();
            return snapshot.docs.map(d => {
                const d_ = d.data();
                return { id: d_.id as number, name: (d_.name as string) || "", docId: d.id };
            });
        } catch (error) {
            console.error("Firestore getStudentsByIds error:", error);
            return [];
        }
    },

    /** 여러 학생 문서 ID에 대한 id·이름·docId 목록 (학부모 자녀 목록 등) */
    async getStudentsByDocIds(docIds: string[]): Promise<{ id: number; name: string; docId: string }[]> {
        if (docIds.length === 0 || !adminDb) return [];
        const result: { id: number; name: string; docId: string }[] = [];
        try {
            for (const docId of docIds.slice(0, 30)) {
                const doc = await adminDb.collection("students").doc(docId).get();
                if (!doc.exists) continue;
                const d = doc.data()!;
                result.push({
                    id: d.id as number,
                    name: (d.name as string) || "",
                    docId: doc.id,
                });
            }
            return result;
        } catch (error) {
            console.error("Firestore getStudentsByDocIds error:", error);
            return [];
        }
    },

    async getStudentDetail(id: number) {
        if (!adminDb) return null;
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

    /** 라우트 id(숫자 또는 docId)를 Firestore 문서 ID(docId)로 변환 */
    async getStudentDocIdFromRouteId(routeId: string): Promise<string | null> {
        if (!adminDb || !routeId) return null;
        if (/^\d+$/.test(routeId)) {
            const snapshot = await adminDb.collection("students").where("id", "==", parseInt(routeId, 10)).limit(1).get();
            return snapshot.empty ? null : snapshot.docs[0].id;
        }
        const doc = await adminDb.collection("students").doc(routeId).get();
        return doc.exists ? doc.id : null;
    },

    /** 문서 ID 또는 숫자 id(문자열)로 학생 상세 조회 (URL·라우트용). 문서 ID를 먼저 시도하고, 없으면 id 필드로 조회 */
    async getStudentDetailByDocId(docId: string) {
        if (!adminDb || !docId) return null;
        try {
            let docRef: FirebaseFirestore.DocumentReference;
            const byDocId = adminDb.collection("students").doc(docId);
            const docByDocId = await byDocId.get();
            if (docByDocId.exists) {
                docRef = byDocId;
            } else if (/^\d+$/.test(docId)) {
                const snapshot = await adminDb.collection("students").where("id", "==", parseInt(docId, 10)).limit(1).get();
                if (snapshot.empty) return null;
                docRef = snapshot.docs[0].ref;
            } else {
                return null;
            }
            const doc = await docRef.get();
            if (!doc.exists) return null;

            const studentData = doc.data() as Student;
            const unitsSnapshot = await docRef.collection("units").orderBy("createdAt", "desc").get();
            const units = unitsSnapshot.docs.map(u => ({ ...u.data() }));

            return {
                ...studentData,
                docId: doc.id,
                units
            };
        } catch (error) {
            console.error("Firestore getStudentDetailByDocId error:", error);
            return null;
        }
    },

    async createStudent(data: any): Promise<{ success: true; id: number; docId: string } | { success: false; message: string }> {
        if (!adminDb) return { success: false, message: "Database not available" };
        try {
            const nextId = await getNextNumericId("students");
            const approvalStatus = data.approvalStatus ?? "APPROVED"; // 카카오/회원가입은 "PENDING" 전달
            const { approvalStatus: _, ...rest } = data;
            const ref = await adminDb.collection("students").add({
                ...rest,
                id: nextId,
                createdAt: new Date().toISOString(),
                isActive: true,
                approvalStatus,
                accountStatus: "ACTIVE",
            });
            return { success: true, id: nextId, docId: ref.id };
        } catch (error) {
            console.error("Firestore createStudent error:", error);
            return { success: false, message: "Failed to create student" };
        }
    },

    async updateStudent(id: number, data: any) {
        if (!adminDb) return { success: false, message: "Database not available" };
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
        if (!adminDb) return { success: false, message: "Student not found" };
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

    async updateStudentByDocId(docId: string, data: any) {
        if (!adminDb || !docId) return { success: false, message: "Database not available" };
        try {
            const docRef = adminDb.collection("students").doc(docId);
            const doc = await docRef.get();
            if (!doc.exists) return { success: false, message: "Student not found" };
            await docRef.update(data);
            return { success: true };
        } catch (error) {
            console.error("Firestore updateStudentByDocId error:", error);
            return { success: false, message: "Failed to update student" };
        }
    },

    async deleteStudentByDocId(docId: string) {
        if (!adminDb || !docId) return { success: false, message: "Student not found" };
        try {
            const docRef = adminDb.collection("students").doc(docId);
            const doc = await docRef.get();
            if (!doc.exists) return { success: false, message: "Student not found" };
            await docRef.delete();
            return { success: true };
        } catch (error) {
            console.error("Firestore deleteStudentByDocId error:", error);
            return { success: false, message: "Student not found" };
        }
    },

    async getDashboardStats(studentId: number) {
        if (!adminDb) {
            return { recentLogin: null, nextClass: null, monthlyLoginCount: 0, persistenceRate: 100 };
        }
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
    },

    async getDashboardStatsByDocId(docId: string) {
        if (!adminDb || !docId) {
            return { recentLogin: null, nextClass: null, monthlyLoginCount: 0, persistenceRate: 100 };
        }
        try {
            const docRef = adminDb.collection("students").doc(docId);
            const studentDoc = await docRef.get();
            if (!studentDoc.exists) return null;

            const studentData = studentDoc.data() as any;
            const loginHistory = studentData.loginHistory || [];
            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();

            const monthlyLogins = loginHistory.filter((isoString: string) => {
                const date = new Date(isoString);
                return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
            });

            const todayStr = now.toISOString().split("T")[0];
            const schedulesSnapshot = await docRef.collection("schedules")
                .where("date", ">=", todayStr)
                .orderBy("date", "asc")
                .limit(5)
                .get();

            let nextClass = null;
            if (!schedulesSnapshot.empty) {
                const schedules = schedulesSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
                (schedules as any[]).sort((a, b) => {
                    if (a.date === b.date) return (a.startTime || "").localeCompare(b.startTime || "");
                    return 0;
                });
                nextClass = schedules[0];
            }

            return {
                recentLogin: studentData.lastLogin || null,
                nextClass,
                monthlyLoginCount: monthlyLogins.length,
                persistenceRate: studentData.persistenceRate || 100,
            };
        } catch (error) {
            console.error("Firestore getDashboardStatsByDocId error:", error);
            return { recentLogin: null, nextClass: null, monthlyLoginCount: 0, persistenceRate: 100 };
        }
    },
};
