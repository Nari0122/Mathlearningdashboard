import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { getAuthOptions } from "@/lib/auth";
import { listAdminsAction } from "@/actions/admin-management-actions";
import { AdminsClient } from "@/components/features/admin/AdminsClient";

/** Super Admin 전용: 관리자 목록 및 승인/반려 */
export default async function AdminAdminsPage() {
    const session = await getServerSession(getAuthOptions(undefined));
    const role = (session?.user as { role?: string })?.role;

    if (!session) redirect("/login");
    if (role !== "SUPER_ADMIN") redirect("/admin/students");

    const result = await listAdminsAction();
    const list = result.success ? result.list : [];

    return (
        <div>
            <AdminsClient list={list} />
        </div>
    );
}
