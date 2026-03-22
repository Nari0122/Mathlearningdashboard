import { admin } from "@/lib/firebase-admin";
import { adminDb } from "@/lib/firebase-admin";
import { toKSTISOString } from "@/lib/date-kst";
import { getPhoneDigits } from "@/lib/phone";

const PARENTS_COLLECTION = "parents";

export const parentService = {
    async getParentByUid(uid: string): Promise<{ uid: string; studentIds?: string[]; [key: string]: unknown } | null> {
        if (!adminDb) return null;
        try {
            const doc = await adminDb.collection(PARENTS_COLLECTION).doc(uid).get();
            if (!doc.exists) return null;
            return doc.data() as { uid: string; studentIds?: string[]; [key: string]: unknown };
        } catch (error) {
            console.error("[parentService.getParentByUid]", error);
            return null;
        }
    },

    /**
     * 자녀 연동: 학생 이름·학생 전화번호·학부모 전화번호가 모두 일치하는 학생 문서 1건 조회.
     * 반환에 Firestore 문서 ID(docId) 포함.
     */
    async findStudentByNameAndPhones(
        name: string,
        studentPhone: string,
        parentPhone: string
    ): Promise<{ docId: string; name: string; [key: string]: unknown } | null> {
        if (!adminDb) return null;
        try {
            const studentDigits = getPhoneDigits(studentPhone);
            const parentDigits = getPhoneDigits(parentPhone);
            const snapshot = await adminDb
                .collection("students")
                .where("name", "==", name.trim())
                .get();
            for (const doc of snapshot.docs) {
                const data = doc.data() as { phone?: string; parentPhone?: string; name: string; [key: string]: unknown };
                if (
                    getPhoneDigits(data.phone ?? "") === studentDigits &&
                    getPhoneDigits(data.parentPhone ?? "") === parentDigits
                ) {
                    return { ...data, docId: doc.id };
                }
            }
            return null;
        } catch (error) {
            console.error("[parentService.findStudentByNameAndPhones]", error);
            return null;
        }
    },

    /** 학부모 문서의 studentIds 배열에 학생 문서 ID(docId) 추가 (중복 시 무시) */
    async addStudentDocIdToParent(parentUid: string, studentDocId: string): Promise<{ success: true } | { success: false; message: string }> {
        if (!adminDb) return { success: false, message: "Database not available" };
        try {
            const ref = adminDb.collection(PARENTS_COLLECTION).doc(parentUid);
            await ref.update({
                studentIds: admin.firestore.FieldValue.arrayUnion(studentDocId),
            });
            return { success: true };
        } catch (error) {
            console.error("[parentService.addStudentDocIdToParent]", error);
            return { success: false, message: "자녀 연동에 실패했습니다." };
        }
    },

    /** 학부모 문서의 studentIds 배열에서 학생 문서 ID 제거 (연동 해제). 계정은 삭제하지 않음. */
    async removeStudentDocIdFromParent(parentUid: string, studentDocId: string): Promise<{ success: true } | { success: false; message: string }> {
        if (!adminDb) return { success: false, message: "Database not available" };
        try {
            const ref = adminDb.collection(PARENTS_COLLECTION).doc(parentUid);
            const doc = await ref.get();
            if (!doc.exists) return { success: false, message: "학부모 정보를 찾을 수 없습니다." };
            await ref.update({
                studentIds: admin.firestore.FieldValue.arrayRemove(studentDocId),
            });

            const staleRequests = await adminDb.collection("parentLinkRequests")
                .where("parentUid", "==", parentUid)
                .where("studentDocId", "==", studentDocId)
                .get();
            const batch = adminDb.batch();
            staleRequests.docs.forEach((d) => batch.delete(d.ref));
            if (!staleRequests.empty) await batch.commit();

            return { success: true };
        } catch (error) {
            console.error("[parentService.removeStudentDocIdFromParent]", error);
            return { success: false, message: "연동 해제에 실패했습니다." };
        }
    },

    async createParent(data: {
        uid: string;
        name?: string | null;
        image?: string | null;
    }): Promise<{ success: true } | { success: false; message: string }> {
        if (!adminDb) return { success: false, message: "Database not available" };
        try {
            await adminDb
                .collection(PARENTS_COLLECTION)
                .doc(data.uid)
                .set({
                    uid: data.uid,
                    name: data.name ?? "",
                    image: data.image ?? "",
                    createdAt: toKSTISOString(),
                    studentIds: [],
                });
            return { success: true };
        } catch (error) {
            console.error("[parentService.createParent]", error);
            return { success: false, message: "학부모 등록에 실패했습니다." };
        }
    },

    async recordParentLoginByUid(uid: string) {
        if (!adminDb || !uid) return;
        try {
            const docRef = adminDb.collection(PARENTS_COLLECTION).doc(uid);
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
        } catch (error) {
            console.error("[parentService.recordParentLoginByUid]", error);
        }
    },

    /** 해당 학생이 studentIds에 포함된 학부모 목록 (연동된 학부모. parents 컬렉션만 사용). 전화번호·로그인 기록 포함. */
    async getParentsLinkedToStudent(studentDocId: string): Promise<{ uid: string; name: string; phoneNumber?: string; loginHistory?: string[] }[]> {
        if (!adminDb || !studentDocId) return [];
        try {
            const snapshot = await adminDb
                .collection(PARENTS_COLLECTION)
                .where("studentIds", "array-contains", studentDocId)
                .get();
            return snapshot.docs.map((doc) => {
                const d = doc.data();
                return {
                    uid: doc.id,
                    name: (d.name as string) || "학부모",
                    phoneNumber: (d.phoneNumber as string) || (d.phone as string) || undefined,
                    loginHistory: Array.isArray(d.loginHistory) ? d.loginHistory : undefined,
                };
            });
        } catch (error) {
            console.error("[parentService.getParentsLinkedToStudent]", error);
            return [];
        }
    },

    // ========== 학부모-학생 연동 요청 (parentLinkRequests 컬렉션) ==========

    async createLinkRequest(data: {
        parentUid: string;
        parentName: string;
        studentDocId: string;
        studentName: string;
    }): Promise<{ success: true; linkId: string } | { success: false; message: string }> {
        if (!adminDb) return { success: false, message: "Database not available" };
        try {
            const existing = await adminDb.collection("parentLinkRequests")
                .where("parentUid", "==", data.parentUid)
                .where("studentDocId", "==", data.studentDocId)
                .where("status", "==", "pending")
                .limit(1)
                .get();
            if (!existing.empty) {
                return { success: false, message: "이미 해당 학생에게 연동 요청을 보냈습니다. 학생의 승인을 기다려 주세요." };
            }
            const docRef = await adminDb.collection("parentLinkRequests").add({
                parentUid: data.parentUid,
                parentName: data.parentName,
                studentDocId: data.studentDocId,
                studentName: data.studentName,
                status: "pending",
                requestedAt: toKSTISOString(),
            });
            return { success: true, linkId: docRef.id };
        } catch (error) {
            console.error("[parentService.createLinkRequest]", error);
            return { success: false, message: "연동 요청 생성에 실패했습니다." };
        }
    },

    async getPendingRequestsByParent(parentUid: string): Promise<
        { linkId: string; studentDocId: string; studentName: string; requestedAt: string }[]
    > {
        if (!adminDb) return [];
        try {
            const snapshot = await adminDb.collection("parentLinkRequests")
                .where("parentUid", "==", parentUid)
                .where("status", "==", "pending")
                .get();
            const results = snapshot.docs.map((doc) => {
                const d = doc.data();
                return {
                    linkId: doc.id,
                    studentDocId: d.studentDocId as string,
                    studentName: d.studentName as string,
                    requestedAt: d.requestedAt as string,
                };
            });
            results.sort((a, b) => (b.requestedAt || "").localeCompare(a.requestedAt || ""));
            return results;
        } catch (error) {
            console.error("[parentService.getPendingRequestsByParent]", error);
            return [];
        }
    },

    async getPendingRequestsByStudent(studentDocId: string): Promise<
        { linkId: string; parentUid: string; parentName: string; requestedAt: string }[]
    > {
        if (!adminDb) return [];
        try {
            const snapshot = await adminDb.collection("parentLinkRequests")
                .where("studentDocId", "==", studentDocId)
                .where("status", "==", "pending")
                .get();
            const results = snapshot.docs.map((doc) => {
                const d = doc.data();
                return {
                    linkId: doc.id,
                    parentUid: d.parentUid as string,
                    parentName: d.parentName as string,
                    requestedAt: d.requestedAt as string,
                };
            });
            results.sort((a, b) => (b.requestedAt || "").localeCompare(a.requestedAt || ""));
            return results;
        } catch (error) {
            console.error("[parentService.getPendingRequestsByStudent]", error);
            return [];
        }
    },

    async getLinkRequestById(linkId: string): Promise<{ parentUid: string; studentDocId: string; status: string } | null> {
        if (!adminDb) return null;
        try {
            const doc = await adminDb.collection("parentLinkRequests").doc(linkId).get();
            if (!doc.exists) return null;
            const d = doc.data()!;
            return {
                parentUid: d.parentUid as string,
                studentDocId: d.studentDocId as string,
                status: d.status as string,
            };
        } catch (error) {
            console.error("[parentService.getLinkRequestById]", error);
            return null;
        }
    },

    async acceptLinkRequest(linkId: string): Promise<{ success: true; parentUid: string; studentDocId: string } | { success: false; message: string }> {
        if (!adminDb) return { success: false, message: "Database not available" };
        try {
            const ref = adminDb.collection("parentLinkRequests").doc(linkId);
            const doc = await ref.get();
            if (!doc.exists) return { success: false, message: "요청을 찾을 수 없습니다." };
            const data = doc.data()!;
            if (data.status !== "pending") return { success: false, message: "이미 처리된 요청입니다." };

            const parentUid = data.parentUid as string;
            const studentDocId = data.studentDocId as string;

            await adminDb.collection(PARENTS_COLLECTION).doc(parentUid).update({
                studentIds: admin.firestore.FieldValue.arrayUnion(studentDocId),
            });

            await ref.delete();

            return { success: true, parentUid, studentDocId };
        } catch (error) {
            console.error("[parentService.acceptLinkRequest]", error);
            return { success: false, message: "승인 처리에 실패했습니다." };
        }
    },

    async rejectLinkRequest(linkId: string): Promise<{ success: true } | { success: false; message: string }> {
        if (!adminDb) return { success: false, message: "Database not available" };
        try {
            const ref = adminDb.collection("parentLinkRequests").doc(linkId);
            const doc = await ref.get();
            if (!doc.exists) return { success: false, message: "요청을 찾을 수 없습니다." };
            const data = doc.data()!;
            if (data.status !== "pending") return { success: false, message: "이미 처리된 요청입니다." };

            await ref.delete();
            return { success: true };
        } catch (error) {
            console.error("[parentService.rejectLinkRequest]", error);
            return { success: false, message: "거절 처리에 실패했습니다." };
        }
    },

    async deleteParent(parentUid: string): Promise<{ success: true } | { success: false; message: string }> {
        if (!adminDb) return { success: false, message: "Database not available" };
        try {
            const pendingSnapshot = await adminDb.collection("parentLinkRequests")
                .where("parentUid", "==", parentUid)
                .get();
            const batch = adminDb.batch();
            pendingSnapshot.docs.forEach((doc) => batch.delete(doc.ref));
            batch.delete(adminDb.collection(PARENTS_COLLECTION).doc(parentUid));
            await batch.commit();
            return { success: true };
        } catch (error) {
            console.error("[parentService.deleteParent]", error);
            return { success: false, message: "탈퇴 처리에 실패했습니다." };
        }
    },

    /** 관리자: 전체 학부모 목록 (uid, name, studentIds 등) */
    async getAllParents(): Promise<{ uid: string; name: string; studentIds: string[]; [key: string]: unknown }[]> {
        if (!adminDb) return [];
        try {
            const snapshot = await adminDb.collection(PARENTS_COLLECTION).get();
            const list = snapshot.docs.map((doc) => {
                const d = doc.data();
                return {
                    ...d,
                    uid: doc.id,
                    name: (d.name as string) || "",
                    studentIds: (d.studentIds as string[]) || [],
                } as { uid: string; name: string; studentIds: string[]; createdAt?: string; [key: string]: unknown };
            });
            list.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
            return list;
        } catch (error) {
            console.error("[parentService.getAllParents]", error);
            return [];
        }
    },
};
