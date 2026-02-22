import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { getAuthOptions } from "@/lib/auth";
import { getLinkedStudentsForParent, getSentPendingRequests } from "@/actions/parent-actions";
import { parentService } from "@/services/parentService";
import { ParentDashboardClient } from "@/components/features/parent/ParentDashboardClient";

export default async function ParentDashboardPage({
    params,
}: {
    params: Promise<{ uid: string }>;
}) {
    const session = await getServerSession(getAuthOptions(undefined));
    const sessionUid = (session?.user as { sub?: string })?.sub ?? (session?.user as { id?: string })?.id;
    const { uid } = await params;

    if (!session || !sessionUid || sessionUid !== uid) redirect("/login");

    const parent = await parentService.getParentByUid(uid);
    if (!parent) redirect("/login");

    const [linkedStudents, sentPendingRequests] = await Promise.all([
        getLinkedStudentsForParent(uid),
        getSentPendingRequests(uid),
    ]);
    const parentName = (parent.name as string) || "학부모";

    return (
        <ParentDashboardClient
            parentUid={uid}
            linkedStudents={linkedStudents}
            parentName={parentName}
            sentPendingRequests={sentPendingRequests}
        />
    );
}
