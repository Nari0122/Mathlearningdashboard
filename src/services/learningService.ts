import { adminDb } from "@/lib/firebase-admin";

// Internal helper to find student document by numeric ID
async function getStudentDocRef(studentId: number) {
    const snapshot = await adminDb.collection("students").where("id", "==", studentId).limit(1).get();
    if (snapshot.empty) return null;
    return snapshot.docs[0].ref;
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
    async getUnits(studentId: number) {
        try {
            const studentDocRef = await getStudentDocRef(studentId);
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

    async createUnit(studentId: number, data: any) {
        try {
            const studentDocRef = await getStudentDocRef(studentId);
            if (!studentDocRef) return { success: false, message: "Student not found" };

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

    async updateUnit(studentId: number, unitId: number, data: any) {
        try {
            const studentDocRef = await getStudentDocRef(studentId);
            if (!studentDocRef) return { success: false, message: "Student not found" };

            const unitDocRef = await getUnitDocRef(studentDocRef, unitId);
            if (!unitDocRef) return { success: false, message: "Unit not found" };

            await unitDocRef.update(data);
            return { success: true };
        } catch (error) {
            console.error("Firestore updateUnit error:", error);
            return { success: false, message: "Failed to update unit" };
        }
    },

    async deleteUnit(studentId: number, unitId: number) {
        try {
            const studentDocRef = await getStudentDocRef(studentId);
            if (!studentDocRef) return { success: false, message: "Student not found" };

            const unitDocRef = await getUnitDocRef(studentDocRef, unitId);
            if (!unitDocRef) return { success: false, message: "Unit not found" };

            await unitDocRef.delete();
            return { success: true };
        } catch (error) {
            console.error("Firestore deleteUnit error:", error);
            return { success: false, message: "Failed to delete unit" };
        }
    },

    async updateUnitError(studentId: number, unitId: number, errorType: 'C' | 'M' | 'R' | 'S', delta: number) {
        try {
            const studentDocRef = await getStudentDocRef(studentId);
            if (!studentDocRef) return { success: false, message: "Student not found" };

            const unitDocRef = await getUnitDocRef(studentDocRef, unitId);
            if (!unitDocRef) return { success: false, message: "Unit not found" };

            const doc = await unitDocRef.get();
            const data = doc.data() || {};
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
        const students = await adminDb.collection("students").get();
        for (const studentDoc of students.docs) {
            const unitSnapshot = await studentDoc.ref.collection("units").where("id", "==", unitId).limit(1).get();
            if (!unitSnapshot.empty) {
                return {
                    unitRef: unitSnapshot.docs[0].ref,
                    studentId: studentDoc.data().id
                };
            }
        }
        return null;
    },

    async getLearningRecords(studentId: number) {
        try {
            const studentDocRef = await getStudentDocRef(studentId);
            if (!studentDocRef) return [];

            const snapshot = await studentDocRef.collection("learningRecords").orderBy("date", "desc").get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error("Firestore getLearningRecords error:", error);
            return [];
        }
    },

    async createLearningRecord(studentId: number, data: any) {
        try {
            const studentDocRef = await getStudentDocRef(studentId);
            if (!studentDocRef) return { success: false, message: "Student not found" };

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

    async updateLearningRecord(studentId: number, recordId: string, data: any) {
        try {
            const studentDocRef = await getStudentDocRef(studentId);
            if (!studentDocRef) return { success: false, message: "Student not found" };

            await studentDocRef.collection("learningRecords").doc(recordId).update(data);
            return { success: true };
        } catch (error) {
            console.error("Firestore updateLearningRecord error:", error);
            return { success: false, message: "Failed to update learning record" };
        }
    },

    async deleteLearningRecord(studentId: number, recordId: string) {
        try {
            const studentDocRef = await getStudentDocRef(studentId);
            if (!studentDocRef) return { success: false, message: "Student not found" };

            await studentDocRef.collection("learningRecords").doc(recordId).delete();
            return { success: true };
        } catch (error) {
            console.error("Firestore deleteLearningRecord error:", error);
            return { success: false, message: "Failed to delete learning record" };
        }
    },

    async getSchedules(studentId: number) {
        try {
            const studentDocRef = await getStudentDocRef(studentId);
            if (!studentDocRef) return [];

            const snapshot = await studentDocRef.collection("schedules").orderBy("date", "desc").get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error("Firestore getSchedules error:", error);
            return [];
        }
    },

    async createSchedule(studentId: number, data: any) {
        try {
            const studentDocRef = await getStudentDocRef(studentId);
            if (!studentDocRef) return { success: false, message: "Student not found" };

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

    async deleteSchedule(studentId: number, scheduleId: string) {
        try {
            const studentDocRef = await getStudentDocRef(studentId);
            if (!studentDocRef) return { success: false, message: "Student not found" };

            await studentDocRef.collection("schedules").doc(scheduleId).delete();
            return { success: true };
        } catch (error) {
            console.error("Firestore deleteSchedule error:", error);
            return { success: false, message: "Failed to delete schedule" };
        }
    },

    async getAssignments(studentId: number) {
        try {
            const studentDocRef = await getStudentDocRef(studentId);
            if (!studentDocRef) return [];

            const snapshot = await studentDocRef.collection("assignments").orderBy("dueDate", "desc").get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as unknown as any[];
        } catch (error) {
            console.error("Firestore getAssignments error:", error);
            return [];
        }
    },

    async createAssignment(studentId: number, data: any) {
        try {
            const studentDocRef = await getStudentDocRef(studentId);
            if (!studentDocRef) return { success: false, message: "Student not found" };

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

    async updateAssignment(studentId: number, assignmentId: string, data: any) {
        try {
            const studentDocRef = await getStudentDocRef(studentId);
            if (!studentDocRef) return { success: false, message: "Student not found" };

            await studentDocRef.collection("assignments").doc(assignmentId).update(data);
            return { success: true };
        } catch (error) {
            console.error("Firestore updateAssignment error:", error);
            return { success: false, message: "Failed to update assignment" };
        }
    },

    async deleteAssignment(studentId: number, assignmentId: string) {
        try {
            const studentDocRef = await getStudentDocRef(studentId);
            if (!studentDocRef) return { success: false, message: "Student not found" };

            await studentDocRef.collection("assignments").doc(assignmentId).delete();
            return { success: true };
        } catch (error) {
            console.error("Firestore deleteAssignment error:", error);
            return { success: false, message: "Failed to delete assignment" };
        }
    },

    async getExams(studentId: number) {
        try {
            const studentDocRef = await getStudentDocRef(studentId);
            if (!studentDocRef) return [];

            const snapshot = await studentDocRef.collection("exams").orderBy("date", "desc").get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error("Firestore getExams error:", error);
            return [];
        }
    },

    async createExam(studentId: number, data: any) {
        try {
            const studentDocRef = await getStudentDocRef(studentId);
            if (!studentDocRef) return { success: false, message: "Student not found" };

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

    async updateExam(studentId: number, examId: string, data: any) {
        try {
            const studentDocRef = await getStudentDocRef(studentId);
            if (!studentDocRef) return { success: false, message: "Student not found" };

            await studentDocRef.collection("exams").doc(examId).update(data);
            return { success: true };
        } catch (error) {
            console.error("Firestore updateExam error:", error);
            return { success: false, message: "Failed to update exam" };
        }
    },

    async deleteExam(studentId: number, examId: string) {
        try {
            const studentDocRef = await getStudentDocRef(studentId);
            if (!studentDocRef) return { success: false, message: "Student not found" };

            await studentDocRef.collection("exams").doc(examId).delete();
            return { success: true };
        } catch (error) {
            console.error("Firestore deleteExam error:", error);
            return { success: false, message: "Failed to delete exam" };
        }
    },

    async getIncorrectNotes(studentId: number) {
        try {
            const studentDocRef = await getStudentDocRef(studentId);
            if (!studentDocRef) return [];

            const snapshot = await studentDocRef.collection("incorrectNotes").orderBy("createdAt", "desc").get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error("Firestore getIncorrectNotes error:", error);
            return [];
        }
    },

    async createIncorrectNote(studentId: number, data: any) {
        try {
            const studentDocRef = await getStudentDocRef(studentId);
            if (!studentDocRef) return { success: false, message: "Student not found" };

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

    async updateIncorrectNote(studentId: number, noteId: string, data: any) {
        try {
            const studentDocRef = await getStudentDocRef(studentId);
            if (!studentDocRef) return { success: false, message: "Student not found" };

            // Regenerate searchKey if any relevant field is being updated
            const searchKey = generateSearchKey(data);

            await studentDocRef.collection("incorrectNotes").doc(noteId).update({
                ...data,
                searchKey,
            });
            return { success: true };
        } catch (error) {
            console.error("Firestore updateIncorrectNote error:", error);
            return { success: false, message: "Failed to update incorrect note" };
        }
    },

    async deleteIncorrectNote(studentId: number, noteId: string) {
        try {
            const studentDocRef = await getStudentDocRef(studentId);
            if (!studentDocRef) return { success: false, message: "Student not found" };

            await studentDocRef.collection("incorrectNotes").doc(noteId).delete();
            return { success: true };
        } catch (error) {
            console.error("Firestore deleteIncorrectNote error:", error);
            return { success: false, message: "Failed to delete incorrect note" };
        }
    },

    // ========== BookTag Functions ==========
    async getBookTags(studentId: number) {
        try {
            const studentDocRef = await getStudentDocRef(studentId);
            if (!studentDocRef) return [];

            const snapshot = await studentDocRef.collection("bookTags").orderBy("lastUsedAt", "desc").get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error("Firestore getBookTags error:", error);
            return [];
        }
    },

    async createBookTag(studentId: number, name: string) {
        try {
            const studentDocRef = await getStudentDocRef(studentId);
            if (!studentDocRef) return { success: false, message: "Student not found" };

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

    async updateBookTagLastUsed(studentId: number, tagId: string) {
        try {
            const studentDocRef = await getStudentDocRef(studentId);
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
    async searchIncorrectNotes(studentId: number, searchKeys: string[]) {
        try {
            const studentDocRef = await getStudentDocRef(studentId);
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
