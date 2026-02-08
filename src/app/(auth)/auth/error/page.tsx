import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_ADMIN_LOGIN_FLOW_COOKIE } from "@/lib/auth-constants";

/**
 * NextAuth OAuth 에러 시 도착. admin_login_flow 쿠키가 있으면 /admin-login으로, 아니면 /login으로 리다이렉트.
 */
export default async function AuthErrorPage({
    searchParams,
}: {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const params = await searchParams;
    const error = typeof params?.error === "string" ? params.error : undefined;
    const headersList = await headers();
    const adminCookie = headersList.get("cookie")?.includes(`${AUTH_ADMIN_LOGIN_FLOW_COOKIE}=1`);

    if (adminCookie) {
        redirect("/admin-login?error=oauth_failed");
    }
    redirect(`/login?error=${encodeURIComponent(error ?? "unknown")}`);
}
