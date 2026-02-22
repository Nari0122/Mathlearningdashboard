import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth";
import { studentService } from "@/services/studentService";
import { learningService } from "@/services/learningService";
import HomeworkClient from "@/components/features/homework/HomeworkClient";

export const dynamic = "force-dynamic";

export default async function HomeworkPage() {
    const session = await getServerSession(getAuthOptions(undefined));
    const uid = (session?.user as { sub?: string })?.sub ?? (session?.user as { id?: string })?.id;
    if (!session || !uid) redirect("/login");

    const studentUser = await studentService.getStudentByUid(uid);
    if (!studentUser) redirect("/signup");

    const homeworks = await learningService.getAssignments(uid);

    return (
        <HomeworkClient
            initialHomeworks={homeworks}
            studentId={studentUser.id as number}
        />
    );
}
