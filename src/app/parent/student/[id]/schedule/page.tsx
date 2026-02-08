import { notFound } from "next/navigation";
import { learningService } from "@/services/learningService";
import StudentScheduleClient from "@/components/features/student/StudentScheduleClient";

export default async function ParentStudentSchedulePage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id: docId } = await params;
    if (!docId) notFound();

    const schedules = await learningService.getSchedules(docId);

    return <StudentScheduleClient schedules={schedules} />;
}
