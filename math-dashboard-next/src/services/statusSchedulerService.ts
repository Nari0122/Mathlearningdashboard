/**
 * 일정/숙제 자동 상태 업데이트 (Cron에서 호출)
 * - 숙제: 마감·최종마감 경과 시 status → overdue / expired
 * - 일정: 수업 종료 시각 경과 시 status → completed
 */
import { adminDb } from "@/lib/firebase-admin";
import { getSubmissionDeadline } from "@/lib/submissionDeadline";

const TZ = "Asia/Seoul";

/** 오늘 날짜 YYYY-MM-DD (Asia/Seoul) */
function todayLocal(): string {
    return new Date().toLocaleDateString("en-CA", { timeZone: TZ });
}

/** 현재 시각 */
function now(): Date {
    return new Date();
}

export const statusSchedulerService = {
    /**
     * 모든 학생의 assignments 중
     * - submittedDate 없고, status가 pending 또는 overdue인 항목에 대해
     * - submissionDeadline 경과 → status = 'expired'
     * - dueDate만 경과 → status = 'overdue'
     */
    async runAssignmentStatusUpdates(): Promise<{ updated: number }> {
        if (!adminDb) return { updated: 0 };
        const nowDate = now();
        const today = todayLocal();
        let updated = 0;

        const studentsSnap = await adminDb.collection("students").get();
        for (const studentDoc of studentsSnap.docs) {
            const assignmentsSnap = await studentDoc.ref
                .collection("assignments")
                .where("status", "in", ["pending", "overdue"])
                .get();

            for (const doc of assignmentsSnap.docs) {
                const d = doc.data();
                if (d.submittedDate) continue;

                const dueDate = d.dueDate || "";
                const deadline = getSubmissionDeadline({
                    submissionDeadline: d.submissionDeadline ?? null,
                    dueDate,
                });

                if (nowDate >= deadline) {
                    await doc.ref.update({ status: "expired" });
                    updated++;
                } else if (today > dueDate) {
                    await doc.ref.update({ status: "overdue" });
                    updated++;
                }
            }
        }
        return { updated };
    },

    /**
     * 모든 학생의 schedules 중
     * - status === 'scheduled' 이고 date+endTime이 현재 이전인 항목 → status = 'completed'
     */
    async runScheduleStatusUpdates(): Promise<{ updated: number }> {
        if (!adminDb) return { updated: 0 };
        const nowDate = now();
        let updated = 0;

        const studentsSnap = await adminDb.collection("students").get();
        for (const studentDoc of studentsSnap.docs) {
            const schedulesSnap = await studentDoc.ref
                .collection("schedules")
                .where("status", "==", "scheduled")
                .get();

            for (const doc of schedulesSnap.docs) {
                const d = doc.data();
                const date = d.date || "";
                const endTime = d.endTime || "23:59";
                const endStr = `${date}T${endTime.includes(":") ? endTime : endTime + ":00"}:00+09:00`;
                const endDt = new Date(endStr);
                if (nowDate >= endDt) {
                    await doc.ref.update({ status: "completed" });
                    updated++;
                }
            }
        }
        return { updated };
    },

    async runAll(): Promise<{ assignmentsUpdated: number; schedulesUpdated: number }> {
        const [a, s] = await Promise.all([
            this.runAssignmentStatusUpdates(),
            this.runScheduleStatusUpdates(),
        ]);
        return { assignmentsUpdated: a.updated, schedulesUpdated: s.updated };
    },
};
