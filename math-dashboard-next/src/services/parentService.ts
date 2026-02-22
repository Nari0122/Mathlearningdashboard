import { admin } from "@/lib/firebase-admin";
import { adminDb } from "@/lib/firebase-admin";
import { getPhoneDigits } from "@/lib/phone";

const PARENTS_COLLECTION = "parents";

export const parentService = {
    async getParentByUid(uid: string): Promise<{ uid: string; studentIds?: (string | number)[]; [key: string]: unknown } | null> {
        if (!adminDb) return null;
        try {
            const doc = await adminDb.collection(PARENTS_COLLECTION).doc(uid).get();
            if (!doc.exists) return null;
            return doc.data() as { uid: string; studentIds?: (string | number)[]; [key: string]: unknown };
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
    ): Promise<{ id: number; docId: string; name: string; [key: string]: unknown } | null> {
        if (!adminDb) return null;
        try {
            const studentDigits = getPhoneDigits(studentPhone);
            const parentDigits = getPhoneDigits(parentPhone);
            const snapshot = await adminDb
                .collection("students")
                .where("name", "==", name.trim())
                .get();
            for (const doc of snapshot.docs) {
                const data = doc.data() as { phone?: string; parentPhone?: string; id: number; name: string; [key: string]: unknown };
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
                    createdAt: new Date().toISOString(),
                    studentIds: [],
                });
            return { success: true };
        } catch (error) {
            console.error("[parentService.createParent]", error);
            return { success: false, message: "학부모 등록에 실패했습니다." };
        }
    },

    /** 해당 학생이 studentIds에 포함된 학부모 목록 (연동된 학부모. parents 컬렉션만 사용). 전화번호 포함. */
    async getParentsLinkedToStudent(studentDocId: string): Promise<{ uid: string; name: string; phoneNumber?: string }[]> {
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
                };
            });
        } catch (error) {
            console.error("[parentService.getParentsLinkedToStudent]", error);
            return [];
        }
    },

    /** 관리자: 전체 학부모 목록 (uid, name, studentIds 등) */
    async getAllParents(): Promise<{ uid: string; name: string; studentIds: (string | number)[]; [key: string]: unknown }[]> {
        if (!adminDb) return [];
        try {
            const snapshot = await adminDb.collection(PARENTS_COLLECTION).get();
            const list = snapshot.docs.map((doc) => {
                const d = doc.data();
                return {
                    ...d,
                    uid: doc.id,
                    name: (d.name as string) || "",
                    studentIds: (d.studentIds as (string | number)[]) || [],
                } as { uid: string; name: string; studentIds: (string | number)[]; createdAt?: string; [key: string]: unknown };
            });
            list.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
            return list;
        } catch (error) {
            console.error("[parentService.getAllParents]", error);
            return [];
        }
    },
};
