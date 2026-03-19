import { adminDb, admin } from "@/lib/firebase-admin";
import { toKSTISOString, todayKSTString } from "@/lib/date-kst";
import { Student } from "@/types";

export const studentService = {
    async getStudents() {
        if (!adminDb) return [];
        try {
            let snapshot;
            try {
                snapshot = await adminDb.collection("students").orderBy("createdAt", "desc").get();
            } catch {
                snapshot = await adminDb.collection("students").get();
            }
            const results = snapshot.docs.map(doc => {
                const data = doc.data();
                return { ...data, docId: doc.id, createdAt: data.createdAt ?? null };
            });
            results.sort((a, b) => {
                if (!a.createdAt && !b.createdAt) return 0;
                if (!a.createdAt) return 1;
                if (!b.createdAt) return -1;
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });
            return results;
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
                const fallback = await adminDb.collection("students").limit(1).get();
                if (fallback.empty) return null;
                return { ...fallback.docs[0].data(), docId: fallback.docs[0].id } as any;
            }
            return { ...snapshot.docs[0].data(), docId: snapshot.docs[0].id } as any;
        } catch (error) {
            console.error("Firestore getFirstStudent error:", error);
            return null;
        }
    },

    async getStudentByUid(uid: string): Promise<{ docId: string; accountStatus?: string; [key: string]: unknown } | null> {
        if (!adminDb) return null;
        try {
            const doc = await adminDb.collection("students").doc(uid).get();
            if (!doc.exists) return null;
            const data = doc.data() as { accountStatus?: string; [key: string]: unknown };
            return { ...data, docId: doc.id, accountStatus: data.accountStatus ?? "ACTIVE" };
        } catch (error) {
            console.error("Firestore getStudentByUid error:", error);
            return null;
        }
    },

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

    async createStudentWithDocId(
        uid: string,
        data: Record<string, unknown>
    ): Promise<{ success: true; docId: string } | { success: false; message: string }> {
        if (!adminDb) return { success: false, message: "Database not available" };
        try {
            const approvalStatus = (data.approvalStatus as string) ?? "PENDING";
            const { approvalStatus: _, ...rest } = data;
            await adminDb.collection("students").doc(uid).set({
                ...rest,
                createdAt: toKSTISOString(),
                isActive: true,
                approvalStatus,
                accountStatus: "ACTIVE",
            });
            return { success: true, docId: uid };
        } catch (error) {
            console.error("Firestore createStudentWithDocId error:", error);
            return { success: false, message: "Failed to create student" };
        }
    },

    async getStudentsByDocIds(docIds: string[]): Promise<{ name: string; docId: string }[]> {
        if (docIds.length === 0 || !adminDb) return [];
        const result: { name: string; docId: string }[] = [];
        try {
            for (const docId of docIds.slice(0, 30)) {
                const doc = await adminDb.collection("students").doc(docId).get();
                if (!doc.exists) continue;
                const d = doc.data()!;
                result.push({
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

    async getStudentDetailByDocId(docId: string) {
        if (!adminDb || !docId) return null;
        try {
            const docRef = adminDb.collection("students").doc(docId);
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

    async createStudent(data: any): Promise<{ success: true; docId: string } | { success: false; message: string }> {
        if (!adminDb) return { success: false, message: "Database not available" };
        try {
            const approvalStatus = data.approvalStatus ?? "APPROVED";
            const { approvalStatus: _, ...rest } = data;
            const ref = await adminDb.collection("students").add({
                ...rest,
                createdAt: toKSTISOString(),
                isActive: true,
                approvalStatus,
                accountStatus: "ACTIVE",
            });
            return { success: true, docId: ref.id };
        } catch (error) {
            console.error("Firestore createStudent error:", error);
            return { success: false, message: "Failed to create student" };
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

            const subCollections = [
                "units", "assignments", "incorrectNotes", "learningRecords",
                "schedules", "exams", "bookTags", "loginLogs",
            ];

            for (const sub of subCollections) {
                const snap = await docRef.collection(sub).get();
                if (snap.empty) continue;
                const batch = adminDb.batch();
                snap.docs.forEach((d) => batch.delete(d.ref));
                await batch.commit();
            }

            await docRef.delete();
            return { success: true };
        } catch (error) {
            console.error("Firestore deleteStudentByDocId error:", error);
            return { success: false, message: "삭제 중 오류가 발생했습니다." };
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
            const now = new Date();
            const kstToday = todayKSTString(now);
            const startOfMonth = kstToday.slice(0, 7) + "-01T00:00:00+09:00";

            const logsSnapshot = await docRef
                .collection("loginLogs")
                .where("loggedInAt", ">=", startOfMonth)
                .get();
            const monthlyLoginCount = logsSnapshot.size;

            let recentLogin: string | null = studentData.lastLogin || null;
            if (!recentLogin) {
                const latestLogSnap = await docRef
                    .collection("loginLogs")
                    .orderBy("loggedInAt", "desc")
                    .limit(1)
                    .get();
                if (!latestLogSnap.empty) {
                    recentLogin = (latestLogSnap.docs[0].data().loggedInAt as string) ?? null;
                }
            }

            const todayStr = kstToday;
            const kstISO = toKSTISOString(now);
            const nowTimeStr = kstISO.slice(11, 16);

            const schedulesSnapshot = await docRef.collection("schedules")
                .where("date", ">=", todayStr)
                .orderBy("date", "asc")
                .limit(10)
                .get();

            let nextClass = null;
            if (!schedulesSnapshot.empty) {
                const schedules = schedulesSnapshot.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
                schedules.sort((a, b) => {
                    if (a.date === b.date) return (a.startTime || "").localeCompare(b.startTime || "");
                    return 0;
                });
                nextClass = schedules.find((s) => {
                    if (s.date > todayStr) return true;
                    return (s.endTime || "23:59") > nowTimeStr;
                }) ?? null;
            }

            return {
                recentLogin,
                nextClass,
                monthlyLoginCount,
                persistenceRate: studentData.persistenceRate || 100,
            };
        } catch (error) {
            console.error("Firestore getDashboardStatsByDocId error:", error);
            return { recentLogin: null, nextClass: null, monthlyLoginCount: 0, persistenceRate: 100 };
        }
    },

    async recordStudentLoginByUid(uid: string) {
        if (!adminDb || !uid) return;
        try {
            const docRef = adminDb.collection("students").doc(uid);
            const snap = await docRef.get();
            if (!snap.exists) return;

            const nowKST = toKSTISOString();
            const data = snap.data() || {};

            const history: string[] = Array.isArray(data.loginHistory) ? data.loginHistory : [];
            const updatedHistory = [...history, nowKST].slice(-50);

            await docRef.update({
                lastLogin: nowKST,
                loginHistory: updatedHistory,
            });

            await docRef.collection("loginLogs").add({
                loggedInAt: nowKST,
                createdAt: nowKST,
            });
        } catch (error) {
            console.error("Firestore recordStudentLoginByUid error:", error);
        }
    },
};
