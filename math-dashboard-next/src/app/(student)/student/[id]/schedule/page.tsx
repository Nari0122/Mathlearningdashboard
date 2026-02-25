import { learningService } from "@/services/learningService";
import StudentScheduleClient from "@/components/features/student/StudentScheduleClient";

export default async function StudentSchedulePage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id: docId } = await params;
    const schedules = await learningService.getSchedules(docId);
    return <StudentScheduleClient schedules={schedules} />;
}
