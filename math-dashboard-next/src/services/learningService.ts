import { adminDb, getAdminBucket } from "@/lib/firebase-admin";

async function getStudentDocRef(docId: string) {
    if (!adminDb || !docId) return null;
    const ref = adminDb.collection("students").doc(docId);
    const snap = await ref.get();
    return snap.exists ? ref : null;
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

const VALID_ERROR_TYPES = ['C', 'M', 'R', 'S'] as const;

async function syncUnitErrorCount(
    studentDocRef: FirebaseFirestore.DocumentReference,
    unitId: number | undefined,
    errorType: string | undefined,
    delta: number
) {
    if (!unitId || unitId === 0) return;
    if (!errorType || !VALID_ERROR_TYPES.includes(errorType as any)) return;
    try {
        const unitDocRef = await getUnitDocRef(studentDocRef, unitId);
        if (!unitDocRef) return;
        const unitDoc = await unitDocRef.get();
        const data = unitDoc.data() || {};
        const field = `error${errorType}`;
        const current = data[field] || 0;
        const next = Math.max(0, current + delta);
        await unitDocRef.update({ [field]: next });
    } catch (err) {
        console.error("syncUnitErrorCount error (non-fatal):", err);
    }
}

export const learningService = {
    async getUnits(docId: string) {
        try {
            const studentDocRef = await getStudentDocRef(docId);
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

    async createUnit(docId: string, data: any) {
        try {
            const studentDocRef = await getStudentDocRef(docId);
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

    async updateUnit(docId: string, unitId: number, data: any) {
        try {
            const studentDocRef = await getStudentDocRef(docId);
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

    async deleteUnit(docId: string, unitId: number) {
        try {
            const studentDocRef = await getStudentDocRef(docId);
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

    async updateUnitError(docId: string, unitId: number, errorType: 'C' | 'M' | 'R' | 'S', delta: number) {
        try {
            const studentDocRef = await getStudentDocRef(docId);
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
            const studentDocId = unitDoc.ref.parent.parent?.id;
            return {
                unitRef: unitDoc.ref,
                studentDocId
            };
        }
        return null;
    },

    async getLearningRecords(docId: string) {
        try {
            const studentDocRef = await getStudentDocRef(docId);
            if (!studentDocRef) return [];

            const snapshot = await studentDocRef.collection("learningRecords").orderBy("date", "desc").get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error("Firestore getLearningRecords error:", error);
            return [];
        }
    },

    async createLearningRecord(docId: string, data: any) {
        try {
            const studentDocRef = await getStudentDocRef(docId);
            if (!studentDocRef) return { success: false, message: "Student not found" };
            const doc = await studentDocRef.get();
            if (!doc.exists) return { success: false, message: "Student not found" };

            await studentDocRef.collection("learningRecords").add({
                ...data,
                createdBy: data.createdBy || "admin",
                createdAt: new Date().toISOString()
            });
            return { success: true };
        } catch (error) {
            console.error("Firestore createLearningRecord error:", error);
            return { success: false, message: "Failed to create learning record" };
        }
    },

    async updateLearningRecord(docId: string, recordId: string, data: any) {
        try {
            const studentDocRef = await getStudentDocRef(docId);
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

    async deleteLearningRecord(docId: string, recordId: string) {
        try {
            const studentDocRef = await getStudentDocRef(docId);
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

    async getSchedules(docId: string) {
        try {
            const studentDocRef = await getStudentDocRef(docId);
            if (!studentDocRef) return [];

            const snapshot = await studentDocRef.collection("schedules").orderBy("date", "desc").get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error("Firestore getSchedules error:", error);
            return [];
        }
    },

    async createSchedule(docId: string, data: any) {
        try {
            const studentDocRef = await getStudentDocRef(docId);
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

    async getSchedule(docId: string, scheduleId: string) {
        try {
            const studentDocRef = await getStudentDocRef(docId);
            if (!studentDocRef) return null;

            const doc = await studentDocRef.collection("schedules").doc(scheduleId).get();
            if (!doc.exists) return null;
            return { id: doc.id, ...doc.data() };
        } catch (error) {
            console.error("Firestore getSchedule error:", error);
            return null;
        }
    },

    async updateSchedule(docId: string, scheduleId: string, data: any) {
        try {
            const studentDocRef = await getStudentDocRef(docId);
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

    async deleteSchedule(docId: string, scheduleId: string) {
        try {
            const studentDocRef = await getStudentDocRef(docId);
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

    async getAssignments(docId: string) {
        try {
            const studentDocRef = await getStudentDocRef(docId);
            if (!studentDocRef) return [];

            const snapshot = await studentDocRef.collection("assignments").orderBy("dueDate", "desc").get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as unknown as any[];
        } catch (error) {
            console.error("Firestore getAssignments error:", error);
            return [];
        }
    },

    async createAssignment(docId: string, data: any) {
        try {
            const studentDocRef = await getStudentDocRef(docId);
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

    async updateAssignment(docId: string, assignmentId: string, data: any) {
        try {
            const studentDocRef = await getStudentDocRef(docId);
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

    async deleteAssignment(docId: string, assignmentId: string) {
        try {
            const studentDocRef = await getStudentDocRef(docId);
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

    async getExams(docId: string) {
        try {
            const studentDocRef = await getStudentDocRef(docId);
            if (!studentDocRef) return [];

            const snapshot = await studentDocRef.collection("exams").orderBy("date", "desc").get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error("Firestore getExams error:", error);
            return [];
        }
    },

    async createExam(docId: string, data: any) {
        try {
            const studentDocRef = await getStudentDocRef(docId);
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

    async updateExam(docId: string, examId: string, data: any) {
        try {
            const studentDocRef = await getStudentDocRef(docId);
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

    async deleteExam(docId: string, examId: string) {
        try {
            const studentDocRef = await getStudentDocRef(docId);
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

    async getIncorrectNotes(docId: string) {
        try {
            const studentDocRef = await getStudentDocRef(docId);
            if (!studentDocRef) return [];

            const snapshot = await studentDocRef.collection("incorrectNotes").orderBy("createdAt", "desc").get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error("Firestore getIncorrectNotes error:", error);
            return [];
        }
    },

    async createIncorrectNote(docId: string, data: any) {
        try {
            const studentDocRef = await getStudentDocRef(docId);
            if (!studentDocRef) return { success: false, message: "Student not found" };
            const doc = await studentDocRef.get();
            if (!doc.exists) return { success: false, message: "Student not found" };

            const searchKey = generateSearchKey(data);

            await studentDocRef.collection("incorrectNotes").add({
                ...data,
                searchKey,
                attachments: data.attachments || [],
                createdAt: new Date().toISOString()
            });

            await syncUnitErrorCount(studentDocRef, data.unitId, data.errorType, +1);

            return { success: true };
        } catch (error) {
            console.error("Firestore createIncorrectNote error:", error);
            return { success: false, message: "Failed to create incorrect note" };
        }
    },

    async updateIncorrectNote(docId: string, noteId: string, data: any) {
        try {
            const studentDocRef = await getStudentDocRef(docId);
            if (!studentDocRef) return { success: false, message: "Student not found" };
            const doc = await studentDocRef.get();
            if (!doc.exists) return { success: false, message: "Student not found" };

            const noteRef = studentDocRef.collection("incorrectNotes").doc(noteId);
            const existingSnap = await noteRef.get();
            const existing = existingSnap.exists ? existingSnap.data() || {} : {};
            const oldErrorType = existing.errorType;
            const oldUnitId = existing.unitId;

            const merged = { ...existing, ...data };
            const searchKey = generateSearchKey(merged);

            await noteRef.update({
                ...merged,
                searchKey,
            });

            const newErrorType = merged.errorType;
            const newUnitId = merged.unitId;
            if (oldErrorType !== newErrorType || oldUnitId !== newUnitId) {
                await syncUnitErrorCount(studentDocRef, oldUnitId, oldErrorType, -1);
                await syncUnitErrorCount(studentDocRef, newUnitId, newErrorType, +1);
            }

            return { success: true };
        } catch (error) {
            console.error("Firestore updateIncorrectNote error:", error);
            return { success: false, message: "Failed to update incorrect note" };
        }
    },

    async deleteIncorrectNote(docId: string, noteId: string) {
        try {
            const studentDocRef = await getStudentDocRef(docId);
            if (!studentDocRef) return { success: false, message: "Student not found" };
            const doc = await studentDocRef.get();
            if (!doc.exists) return { success: false, message: "Student not found" };

            const noteRef = studentDocRef.collection("incorrectNotes").doc(noteId);
            const noteSnap = await noteRef.get();
            const noteData = noteSnap.exists ? noteSnap.data() : null;

            const bucket = getAdminBucket();
            if (noteData && bucket) {
                const attachments = noteData.attachments as { storagePath?: string }[] | undefined;
                if (attachments && attachments.length > 0) {
                    await Promise.allSettled(
                        attachments
                            .filter((a) => a.storagePath)
                            .map((a) => bucket.file(a.storagePath!).delete().catch(() => {}))
                    );
                }
                if (noteData.questionImg && typeof noteData.questionImg === "string" && noteData.questionImg.startsWith("students/")) {
                    await bucket.file(noteData.questionImg).delete().catch(() => {});
                }
            }

            await noteRef.delete();

            if (noteData) {
                await syncUnitErrorCount(studentDocRef, noteData.unitId, noteData.errorType, -1);
            }

            return { success: true };
        } catch (error) {
            console.error("Firestore deleteIncorrectNote error:", error);
            return { success: false, message: "Failed to delete incorrect note" };
        }
    },

    // ========== BookTag Functions ==========
    async getBookTags(docId: string) {
        try {
            const studentDocRef = await getStudentDocRef(docId);
            if (!studentDocRef) return [];

            const snapshot = await studentDocRef.collection("bookTags").orderBy("lastUsedAt", "desc").get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error("Firestore getBookTags error:", error);
            return [];
        }
    },

    async createBookTag(docId: string, name: string) {
        try {
            const studentDocRef = await getStudentDocRef(docId);
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

    async updateBookTagLastUsed(docId: string, tagId: string) {
        try {
            const studentDocRef = await getStudentDocRef(docId);
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
    async searchIncorrectNotes(docId: string, searchKeys: string[]) {
        try {
            const studentDocRef = await getStudentDocRef(docId);
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
