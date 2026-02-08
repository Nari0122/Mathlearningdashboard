import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { getAuthOptions } from "@/lib/auth";

/** /admin/admins: SUPER_ADMIN만 접근. ADMIN은 /admin/students로 리다이렉트 */
export default async function AdminsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getServerSession(getAuthOptions(undefined));
    const role = (session?.user as { role?: string })?.role;

    if (!session) redirect("/admin-login");
    if (role !== "SUPER_ADMIN") redirect("/admin/students");

    return <>{children}</>;
}
