import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth";
import { getUnits } from "@/actions/unit-actions";
import MyLearningClient from "@/components/features/learning/MyLearningClient";
import { studentService } from "@/services/studentService";

export const dynamic = "force-dynamic";

export default async function MyLearningPage() {
    const session = await getServerSession(getAuthOptions(undefined));
    const uid = (session?.user as { sub?: string })?.sub ?? (session?.user as { id?: string })?.id;
    if (!session || !uid) redirect("/login");

    const studentUser = await studentService.getStudentByUid(uid);
    if (!studentUser) redirect("/signup");

    const units = await getUnits(uid);
    return <MyLearningClient initialUnits={units} studentId={studentUser.id as number} />;
}
