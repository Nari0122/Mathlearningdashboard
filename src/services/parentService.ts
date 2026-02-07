import { admin } from "@/lib/firebase-admin";
import { adminDb } from "@/lib/firebase-admin";

const PARENTS_COLLECTION = "parents";

export const parentService = {
    async getParentByUid(uid: string): Promise<{ uid: string; studentIds?: number[]; [key: string]: unknown } | null> {
        if (!adminDb) return null;
        try {
            const doc = await adminDb.collection(PARENTS_COLLECTION).doc(uid).get();
            if (!doc.exists) return null;
            return doc.data() as { uid: string; studentIds?: number[]; [key: string]: unknown };
        } catch (error) {
            console.error("[parentService.getParentByUid]", error);
            return null;
        }
    },

    /**
     * 자녀 연동: 학생 이름·학생 전화번호·학부모 전화번호가 모두 일치하는 학생 문서 1건 조회.
     * Firestore 복합 인덱스 필요: students (name ASC, phone ASC, parentPhone ASC)
     */
    async findStudentByNameAndPhones(
        name: string,
        studentPhone: string,
        parentPhone: string
    ): Promise<{ id: number; name: string; [key: string]: unknown } | null> {
        if (!adminDb) return null;
        try {
            const snapshot = await adminDb
                .collection("students")
                .where("name", "==", name.trim())
                .where("phone", "==", studentPhone.trim())
                .where("parentPhone", "==", parentPhone.trim())
                .limit(1)
                .get();
            if (snapshot.empty) return null;
            const data = snapshot.docs[0].data() as { id: number; name: string; [key: string]: unknown };
            return data;
        } catch (error) {
            console.error("[parentService.findStudentByNameAndPhones]", error);
            return null;
        }
    },

    /** 학부모 문서의 studentIds 배열에 학생 id 추가 (중복 시 무시) */
    async addStudentIdToParent(parentUid: string, studentId: number): Promise<{ success: true } | { success: false; message: string }> {
        if (!adminDb) return { success: false, message: "Database not available" };
        try {
            const ref = adminDb.collection(PARENTS_COLLECTION).doc(parentUid);
            await ref.update({
                studentIds: admin.firestore.FieldValue.arrayUnion(studentId),
            });
            return { success: true };
        } catch (error) {
            console.error("[parentService.addStudentIdToParent]", error);
            return { success: false, message: "자녀 연동에 실패했습니다." };
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
};
