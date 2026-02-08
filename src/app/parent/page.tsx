import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { getAuthOptions } from "@/lib/auth";
import { parentService } from "@/services/parentService";

/** /parent 접근 시: 로그인된 학부모면 /parent/[uid]/dashboard로, 아니면 /login으로 */
export default async function ParentRootPage() {
    const session = await getServerSession(getAuthOptions(undefined));
    const uid = (session?.user as { sub?: string })?.sub ?? (session?.user as { id?: string })?.id;

    if (!session || !uid) redirect("/login");

    const parent = await parentService.getParentByUid(uid);
    if (!parent) redirect("/login");

    redirect(`/parent/${uid}/dashboard`);
}
