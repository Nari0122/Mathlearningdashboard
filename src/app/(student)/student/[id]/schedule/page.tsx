import { notFound } from "next/navigation";
import { learningService } from "@/services/learningService";
import StudentScheduleClient from "@/components/features/student/StudentScheduleClient";

export default async function StudentSchedulePage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const studentId = parseInt(id);
    if (isNaN(studentId)) {
        notFound();
    }

    const schedules = await learningService.getSchedules(studentId);

    return <StudentScheduleClient schedules={schedules} />;
}
