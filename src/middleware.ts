import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

/**
 * /admin/* (대시보드) 접근: JWT에 role이 ADMIN 또는 SUPER_ADMIN일 때만 허용.
 * /admin/admins: SUPER_ADMIN만 접근 가능. ADMIN은 /access-denied로 리다이렉트.
 * 세션 없거나 다른 역할이면 /admin-login으로 리다이렉트.
 */
export default withAuth(
    function middleware(req) {
        const path = req.nextUrl.pathname;
        const role = req.nextauth.token?.role;

        // /admin/admins 경로는 SUPER_ADMIN만 접근
        if (path.startsWith("/admin/admins")) {
            if (role !== "SUPER_ADMIN") {
                return NextResponse.redirect(new URL("/admin/students", req.url));
            }
        }
        return NextResponse.next();
    },
    {
        callbacks: {
            authorized: ({ token }) =>
                token?.role === "ADMIN" || token?.role === "SUPER_ADMIN",
        },
        pages: {
            signIn: "/admin-login",
        },
    }
);

export const config = {
    matcher: ["/admin/students/:path*", "/admin/parents/:path*", "/admin/admins/:path*"],
};
