import { learningService } from "@/services/learningService";
import StudentScheduleClient from "@/components/features/student/StudentScheduleClient";

export default async function StudentSchedulePage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const idParam = /^\d+$/.test(id) ? parseInt(id, 10) : id;
    const schedules = await learningService.getSchedules(idParam);
    return <StudentScheduleClient schedules={schedules} />;
}
