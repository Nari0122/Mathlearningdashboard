import { adminDb } from "@/lib/firebase-admin";

// Internal helper: student document ref by Firestore document ID or numeric id. 문서 ID를 먼저 시도하고, 없으면 id 필드로 조회
async function getStudentDocRef(docIdOrNumericId: string | number) {
    if (!adminDb) return null;
    if (typeof docIdOrNumericId === "string" && docIdOrNumericId) {
        const byDocId = adminDb.collection("students").doc(docIdOrNumericId);
        const snap = await byDocId.get();
        if (snap.exists) return byDocId;
        if (/^\d+$/.test(docIdOrNumericId)) {
            const num = parseInt(docIdOrNumericId, 10);
            const snapshot = await adminDb.collection("students").where("id", "==", num).limit(1).get();
            if (snapshot.empty) return null;
            return snapshot.docs[0].ref;
        }
        return null;
    }
    if (typeof docIdOrNumericId === "number") {
        const snapshot = await adminDb.collection("students").where("id", "==", docIdOrNumericId).limit(1).get();
        if (snapshot.empty) return null;
        return snapshot.docs[0].ref;
    }
    return null;
}

// Internal helper to find unit document by numeric ID within a student's sub-collection
async function getUnitDocRef(studentDocRef: FirebaseFirestore.DocumentReference, unitId: number) {
    const snapshot = await studentDocRef.collection("units").where("id", "==", unitId).limit(1).get();
    if (snapshot.empty) return null;
    return snapshot.docs[0].ref;
}

async function getNextUnitId(studentDocRef: FirebaseFirestore.DocumentReference) {
    const snapshot = await studentDocRef.collection("units").orderBy("id", "desc").limit(1).get();
    if (snapshot.empty) return 1;
    return (snapshot.docs[0].data().id || 0) + 1;
}

// Generate searchKey for incorrect note (denormalized composite key for efficient querying)
function generateSearchKey(data: {
    schoolLevel?: string;
    grade?: string;
    subject?: string;
    unitName?: string;
    unitDetail?: string;
    bookTagId?: string;
    errorType?: string;
    retryCount?: number;
}): string {
    const parts = [
        data.schoolLevel || "_",
        data.grade || "_",
        data.subject || "_",
        data.unitName || "_",
        data.unitDetail || "_",
        data.bookTagId || "_",
        data.errorType || "_",
        data.retryCount !== undefined ? String(data.retryCount) : "_",
    ];
    return parts.join("|");
}

export const learningService = {
    async getUnits(docIdOrNumericId: string | number) {
        try {
            const studentDocRef = await getStudentDocRef(docIdOrNumericId);
            if (!studentDocRef) return [];

            const snapshot = await studentDocRef.collection("units").orderBy("createdAt", "desc").get();
            return snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    ...data,
                    // Default values for new strictly typed fields if they don't exist yet
                    schoolLevel: data.schoolLevel || (['중1', '중2', '중3'].includes(data.grade) ? '중등' : '고등'),
                    unitName: data.unitName || data.name,
                    unitDetails: data.unitDetails || [],
                    name: data.name // Ensure name is preserved
                };
            }) as unknown as any[];
        } catch (error) {
            console.error("Firestore getUnits error:", error);
            return [];
        }
    },

    async createUnit(id: string | number, data: any) {
        try {
            const studentDocRef = await getStudentDocRef(id);
            if (!studentDocRef) return { success: false, message: "Student not found" };
            const doc = await studentDocRef.get();
            if (!doc.exists) return { success: false, message: "Student not found" };

            const nextId = await getNextUnitId(studentDocRef);
            await studentDocRef.collection("units").add({
                ...data,
                id: nextId,
                createdAt: new Date().toISOString(),
                completionStatus: "incomplete",
                errorC: 0, errorM: 0, errorR: 0, errorS: 0
            });
            return { success: true };
        } catch (error) {
            console.error("Firestore createUnit error:", error);
            return { success: false, message: "Failed to create unit" };
        }
    },

    async updateUnit(id: string | number, unitId: number, data: any) {
        try {
            const studentDocRef = await getStudentDocRef(id);
            if (!studentDocRef) return { success: false, message: "Student not found" };
            const doc = await studentDocRef.get();
            if (!doc.exists) return { success: false, message: "Student not found" };

            const unitDocRef = await getUnitDocRef(studentDocRef, unitId);
            if (!unitDocRef) return { success: false, message: "Unit not found" };

            await unitDocRef.update(data);
            return { success: true };
        } catch (error) {
            console.error("Firestore updateUnit error:", error);
            return { success: false, message: "Failed to update unit" };
        }
    },

    async deleteUnit(id: string | number, unitId: number) {
        try {
            const studentDocRef = await getStudentDocRef(id);
            if (!studentDocRef) return { success: false, message: "Student not found" };
            const doc = await studentDocRef.get();
            if (!doc.exists) return { success: false, message: "Student not found" };

            const unitDocRef = await getUnitDocRef(studentDocRef, unitId);
            if (!unitDocRef) return { success: false, message: "Unit not found" };

            await unitDocRef.delete();
            return { success: true };
        } catch (error) {
            console.error("Firestore deleteUnit error:", error);
            return { success: false, message: "Failed to delete unit" };
        }
    },

    async updateUnitError(id: string | number, unitId: number, errorType: 'C' | 'M' | 'R' | 'S', delta: number) {
        try {
            const studentDocRef = await getStudentDocRef(id);
            if (!studentDocRef) return { success: false, message: "Student not found" };
            const doc = await studentDocRef.get();
            if (!doc.exists) return { success: false, message: "Student not found" };

            const unitDocRef = await getUnitDocRef(studentDocRef, unitId);
            if (!unitDocRef) return { success: false, message: "Unit not found" };

            const unitDoc = await unitDocRef.get();
            const data = unitDoc.data() || {};
            const errorField = `error${errorType}`;
            const currentCount = data[errorField] || 0;
            const newCount = Math.min(99, Math.max(0, currentCount + delta));

            await unitDocRef.update({ [errorField]: newCount });
            return { success: true };
        } catch (error) {
            console.error("Firestore updateUnitError error:", error);
            return { success: false, message: "Failed to update unit error" };
        }
    },

    // Helper for "flat" API actions that don't pass studentId
    async findUnitRefGlobally(unitId: number) {
        if (!adminDb) return null;
        // Optimization: Use collectionGroup to search across all 'units' sub-collections 
        // Note: This requires a Firestore index. If not indexed, it will provide a link to create one in console.
        const snapshot = await adminDb.collectionGroup("units").where("id", "==", unitId).limit(1).get();
        if (!snapshot.empty) {
            const unitDoc = snapshot.docs[0];
            // Get studentId from parent student document
            const studentDoc = await unitDoc.ref.parent.parent?.get();
            return {
                unitRef: unitDoc.ref,
                studentId: studentDoc?.data()?.id
            };
        }
        return null;
    },

    async getLearningRecords(id: string | number) {
        try {
            const studentDocRef = await getStudentDocRef(id);
            if (!studentDocRef) return [];

            const snapshot = await studentDocRef.collection("learningRecords").orderBy("date", "desc").get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error("Firestore getLearningRecords error:", error);
            return [];
        }
    },

    async createLearningRecord(id: string | number, data: any) {
        try {
            const studentDocRef = await getStudentDocRef(id);
            if (!studentDocRef) return { success: false, message: "Student not found" };
            const doc = await studentDocRef.get();
            if (!doc.exists) return { success: false, message: "Student not found" };

            await studentDocRef.collection("learningRecords").add({
                ...data,
                createdBy: "admin", // Default to admin for now
                createdAt: new Date().toISOString()
            });
            return { success: true };
        } catch (error) {
            console.error("Firestore createLearningRecord error:", error);
            return { success: false, message: "Failed to create learning record" };
        }
    },

    async updateLearningRecord(id: string | number, recordId: string, data: any) {
        try {
            const studentDocRef = await getStudentDocRef(id);
            if (!studentDocRef) return { success: false, message: "Student not found" };
            const doc = await studentDocRef.get();
            if (!doc.exists) return { success: false, message: "Student not found" };

            await studentDocRef.collection("learningRecords").doc(recordId).update(data);
            return { success: true };
        } catch (error) {
            console.error("Firestore updateLearningRecord error:", error);
            return { success: false, message: "Failed to update learning record" };
        }
    },

    async deleteLearningRecord(id: string | number, recordId: string) {
        try {
            const studentDocRef = await getStudentDocRef(id);
            if (!studentDocRef) return { success: false, message: "Student not found" };
            const doc = await studentDocRef.get();
            if (!doc.exists) return { success: false, message: "Student not found" };

            await studentDocRef.collection("learningRecords").doc(recordId).delete();
            return { success: true };
        } catch (error) {
            console.error("Firestore deleteLearningRecord error:", error);
            return { success: false, message: "Failed to delete learning record" };
        }
    },

    async getSchedules(id: string | number) {
        try {
            const studentDocRef = await getStudentDocRef(id);
            if (!studentDocRef) return [];

            const snapshot = await studentDocRef.collection("schedules").orderBy("date", "desc").get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error("Firestore getSchedules error:", error);
            return [];
        }
    },

    async createSchedule(id: string | number, data: any) {
        try {
            const studentDocRef = await getStudentDocRef(id);
            if (!studentDocRef) return { success: false, message: "Student not found" };
            const doc = await studentDocRef.get();
            if (!doc.exists) return { success: false, message: "Student not found" };

            await studentDocRef.collection("schedules").add({
                ...data,
                createdAt: new Date().toISOString()
            });
            return { success: true };
        } catch (error) {
            console.error("Firestore createSchedule error:", error);
            return { success: false, message: "Failed to create schedule" };
        }
    },

    async getSchedule(id: string | number, scheduleId: string) {
        try {
            const studentDocRef = await getStudentDocRef(id);
            if (!studentDocRef) return null;

            const doc = await studentDocRef.collection("schedules").doc(scheduleId).get();
            if (!doc.exists) return null;
            return { id: doc.id, ...doc.data() };
        } catch (error) {
            console.error("Firestore getSchedule error:", error);
            return null;
        }
    },

    async updateSchedule(id: string | number, scheduleId: string, data: any) {
        try {
            const studentDocRef = await getStudentDocRef(id);
            if (!studentDocRef) return { success: false, message: "Student not found" };
            const doc = await studentDocRef.get();
            if (!doc.exists) return { success: false, message: "Student not found" };

            await studentDocRef.collection("schedules").doc(scheduleId).update(data);
            return { success: true };
        } catch (error) {
            console.error("Firestore updateSchedule error:", error);
            return { success: false, message: "Failed to update schedule" };
        }
    },

    async deleteSchedule(id: string | number, scheduleId: string) {
        try {
            const studentDocRef = await getStudentDocRef(id);
            if (!studentDocRef) return { success: false, message: "Student not found" };
            const doc = await studentDocRef.get();
            if (!doc.exists) return { success: false, message: "Student not found" };

            await studentDocRef.collection("schedules").doc(scheduleId).delete();
            return { success: true };
        } catch (error) {
            console.error("Firestore deleteSchedule error:", error);
            return { success: false, message: "Failed to delete schedule" };
        }
    },

    async getAssignments(id: string | number) {
        try {
            const studentDocRef = await getStudentDocRef(id);
            if (!studentDocRef) return [];

            const snapshot = await studentDocRef.collection("assignments").orderBy("dueDate", "desc").get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as unknown as any[];
        } catch (error) {
            console.error("Firestore getAssignments error:", error);
            return [];
        }
    },

    async createAssignment(id: string | number, data: any) {
        try {
            const studentDocRef = await getStudentDocRef(id);
            if (!studentDocRef) return { success: false, message: "Student not found" };
            const doc = await studentDocRef.get();
            if (!doc.exists) return { success: false, message: "Student not found" };

            await studentDocRef.collection("assignments").add({
                ...data,
                createdAt: new Date().toISOString()
            });
            return { success: true };
        } catch (error) {
            console.error("Firestore createAssignment error:", error);
            return { success: false, message: "Failed to create assignment" };
        }
    },

    async updateAssignment(id: string | number, assignmentId: string, data: any) {
        try {
            const studentDocRef = await getStudentDocRef(id);
            if (!studentDocRef) return { success: false, message: "Student not found" };
            const doc = await studentDocRef.get();
            if (!doc.exists) return { success: false, message: "Student not found" };

            await studentDocRef.collection("assignments").doc(assignmentId).update(data);
            return { success: true };
        } catch (error) {
            console.error("Firestore updateAssignment error:", error);
            return { success: false, message: "Failed to update assignment" };
        }
    },

    async deleteAssignment(id: string | number, assignmentId: string) {
        try {
            const studentDocRef = await getStudentDocRef(id);
            if (!studentDocRef) return { success: false, message: "Student not found" };
            const doc = await studentDocRef.get();
            if (!doc.exists) return { success: false, message: "Student not found" };

            await studentDocRef.collection("assignments").doc(assignmentId).delete();
            return { success: true };
        } catch (error) {
            console.error("Firestore deleteAssignment error:", error);
            return { success: false, message: "Failed to delete assignment" };
        }
    },

    async getExams(id: string | number) {
        try {
            const studentDocRef = await getStudentDocRef(id);
            if (!studentDocRef) return [];

            const snapshot = await studentDocRef.collection("exams").orderBy("date", "desc").get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error("Firestore getExams error:", error);
            return [];
        }
    },

    async createExam(id: string | number, data: any) {
        try {
            const studentDocRef = await getStudentDocRef(id);
            if (!studentDocRef) return { success: false, message: "Student not found" };
            const doc = await studentDocRef.get();
            if (!doc.exists) return { success: false, message: "Student not found" };

            await studentDocRef.collection("exams").add({
                ...data,
                createdAt: new Date().toISOString()
            });
            return { success: true };
        } catch (error) {
            console.error("Firestore createExam error:", error);
            return { success: false, message: "Failed to create exam" };
        }
    },

    async updateExam(id: string | number, examId: string, data: any) {
        try {
            const studentDocRef = await getStudentDocRef(id);
            if (!studentDocRef) return { success: false, message: "Student not found" };
            const doc = await studentDocRef.get();
            if (!doc.exists) return { success: false, message: "Student not found" };

            await studentDocRef.collection("exams").doc(examId).update(data);
            return { success: true };
        } catch (error) {
            console.error("Firestore updateExam error:", error);
            return { success: false, message: "Failed to update exam" };
        }
    },

    async deleteExam(id: string | number, examId: string) {
        try {
            const studentDocRef = await getStudentDocRef(id);
            if (!studentDocRef) return { success: false, message: "Student not found" };
            const doc = await studentDocRef.get();
            if (!doc.exists) return { success: false, message: "Student not found" };

            await studentDocRef.collection("exams").doc(examId).delete();
            return { success: true };
        } catch (error) {
            console.error("Firestore deleteExam error:", error);
            return { success: false, message: "Failed to delete exam" };
        }
    },

    async getIncorrectNotes(id: string | number) {
        try {
            const studentDocRef = await getStudentDocRef(id);
            if (!studentDocRef) return [];

            const snapshot = await studentDocRef.collection("incorrectNotes").orderBy("createdAt", "desc").get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error("Firestore getIncorrectNotes error:", error);
            return [];
        }
    },

    async createIncorrectNote(id: string | number, data: any) {
        try {
            const studentDocRef = await getStudentDocRef(id);
            if (!studentDocRef) return { success: false, message: "Student not found" };
            const doc = await studentDocRef.get();
            if (!doc.exists) return { success: false, message: "Student not found" };

            const searchKey = generateSearchKey(data);

            await studentDocRef.collection("incorrectNotes").add({
                ...data,
                searchKey,
                attachments: data.attachments || [],
                createdAt: new Date().toISOString(),
                isResolved: false
            });
            return { success: true };
        } catch (error) {
            console.error("Firestore createIncorrectNote error:", error);
            return { success: false, message: "Failed to create incorrect note" };
        }
    },

    async updateIncorrectNote(id: string | number, noteId: string, data: any) {
        try {
            const studentDocRef = await getStudentDocRef(id);
            if (!studentDocRef) return { success: false, message: "Student not found" };
            const doc = await studentDocRef.get();
            if (!doc.exists) return { success: false, message: "Student not found" };

            const noteRef = studentDocRef.collection("incorrectNotes").doc(noteId);
            const existingSnap = await noteRef.get();
            const existing = existingSnap.exists ? existingSnap.data() || {} : {};
            const merged = { ...existing, ...data };
            const searchKey = generateSearchKey(merged);

            await noteRef.update({
                ...merged,
                searchKey,
            });
            return { success: true };
        } catch (error) {
            console.error("Firestore updateIncorrectNote error:", error);
            return { success: false, message: "Failed to update incorrect note" };
        }
    },

    async deleteIncorrectNote(id: string | number, noteId: string) {
        try {
            const studentDocRef = await getStudentDocRef(id);
            if (!studentDocRef) return { success: false, message: "Student not found" };
            const doc = await studentDocRef.get();
            if (!doc.exists) return { success: false, message: "Student not found" };

            await studentDocRef.collection("incorrectNotes").doc(noteId).delete();
            return { success: true };
        } catch (error) {
            console.error("Firestore deleteIncorrectNote error:", error);
            return { success: false, message: "Failed to delete incorrect note" };
        }
    },

    // ========== BookTag Functions ==========
    async getBookTags(id: string | number) {
        try {
            const studentDocRef = await getStudentDocRef(id);
            if (!studentDocRef) return [];

            const snapshot = await studentDocRef.collection("bookTags").orderBy("lastUsedAt", "desc").get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error("Firestore getBookTags error:", error);
            return [];
        }
    },

    async createBookTag(id: string | number, name: string) {
        try {
            const studentDocRef = await getStudentDocRef(id);
            if (!studentDocRef) return { success: false, message: "Student not found" };
            const doc = await studentDocRef.get();
            if (!doc.exists) return { success: false, message: "Student not found" };

            // Validate: no spaces
            if (/\s/.test(name)) {
                return { success: false, message: "태그에 공백을 포함할 수 없습니다." };
            }

            // Check for duplicate (case-insensitive)
            const existing = await studentDocRef.collection("bookTags")
                .where("nameLower", "==", name.toLowerCase()).limit(1).get();
            if (!existing.empty) {
                // Return existing tag
                const existingDoc = existing.docs[0];
                return { success: true, tagId: existingDoc.id, existing: true };
            }

            const now = new Date().toISOString();
            const docRef = await studentDocRef.collection("bookTags").add({
                name,
                nameLower: name.toLowerCase(),
                createdAt: now,
                lastUsedAt: now,
            });
            return { success: true, tagId: docRef.id };
        } catch (error) {
            console.error("Firestore createBookTag error:", error);
            return { success: false, message: "Failed to create book tag" };
        }
    },

    async updateBookTagLastUsed(id: string | number, tagId: string) {
        try {
            const studentDocRef = await getStudentDocRef(id);
            if (!studentDocRef) return { success: false };

            await studentDocRef.collection("bookTags").doc(tagId).update({
                lastUsedAt: new Date().toISOString(),
            });
            return { success: true };
        } catch (error) {
            console.error("Firestore updateBookTagLastUsed error:", error);
            return { success: false };
        }
    },

    // ========== Advanced Search ==========
    async searchIncorrectNotes(id: string | number, searchKeys: string[]) {
        try {
            const studentDocRef = await getStudentDocRef(id);
            if (!studentDocRef) return [];

            if (searchKeys.length === 0) {
                // No filters, return all
                const snapshot = await studentDocRef.collection("incorrectNotes").orderBy("createdAt", "desc").get();
                return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            }

            // Firestore 'in' supports max 10 values, batch if needed
            const results: any[] = [];
            const batches = [];
            for (let i = 0; i < searchKeys.length; i += 10) {
                batches.push(searchKeys.slice(i, i + 10));
            }

            for (const batch of batches) {
                const snapshot = await studentDocRef.collection("incorrectNotes")
                    .where("searchKey", "in", batch)
                    .orderBy("createdAt", "desc")
                    .get();
                snapshot.docs.forEach(doc => {
                    results.push({ id: doc.id, ...doc.data() });
                });
            }

            // Deduplicate and sort by createdAt desc
            const uniqueResults = Array.from(new Map(results.map(r => [r.id, r])).values());
            uniqueResults.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            return uniqueResults;
        } catch (error) {
            console.error("Firestore searchIncorrectNotes error:", error);
            return [];
        }
    },
};
