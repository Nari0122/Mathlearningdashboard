import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { getAuthOptions } from "@/lib/auth";

/** 예전 URL 호환: /parent/student/[id] → /parent/[uid]/student/[id] 로 리다이렉트 */
export default async function ParentStudentLayoutLegacy({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ id: string }>;
}) {
    const session = await getServerSession(getAuthOptions(undefined));
    const uid = (session?.user as { sub?: string })?.sub ?? (session?.user as { id?: string })?.id;
    const { id: docId } = await params;

    if (!session || !uid) redirect("/login");
    if (!docId) redirect("/parent");

    redirect(`/parent/${uid}/student/${docId}`);
}
