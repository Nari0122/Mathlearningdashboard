import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { getAuthOptions } from "@/lib/auth";
import { getLinkedStudentsForParent } from "@/actions/parent-actions";
import { parentService } from "@/services/parentService";
import { ParentDashboardClient } from "@/components/features/parent/ParentDashboardClient";

export default async function ParentDashboardPage() {
    const session = await getServerSession(getAuthOptions(undefined));
    const uid = (session?.user as { sub?: string })?.sub ?? (session?.user as { id?: string })?.id;

    if (!session || !uid) {
        redirect("/login");
    }

    const parent = await parentService.getParentByUid(uid);
    if (!parent) {
        redirect("/login");
    }

    const linkedStudents = await getLinkedStudentsForParent(uid);
    const parentName = (parent.name as string) || "학부모";

    return (
        <ParentDashboardClient
            linkedStudents={linkedStudents}
            parentName={parentName}
        />
    );
}
