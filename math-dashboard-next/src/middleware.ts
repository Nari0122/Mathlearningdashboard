import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

function getSecret() {
    return process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
}

export async function middleware(req: NextRequest) {
    const path = req.nextUrl.pathname;
    const token = await getToken({ req, secret: getSecret() });

    const noCacheHeaders = {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
    };

    // ── 비로그인 → 로그인 페이지 ──
    if (!token) {
        if (path.startsWith("/admin/")) {
            return NextResponse.redirect(new URL("/admin-login", req.url));
        }
        return NextResponse.redirect(new URL("/login", req.url));
    }

    const role = token.role as string | undefined;

    // ── /admin/* : ADMIN 또는 SUPER_ADMIN만 허용 ──
    if (path.startsWith("/admin/")) {
        if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
            return NextResponse.redirect(new URL("/access-denied", req.url));
        }
        if ((role === "ADMIN" || role === "SUPER_ADMIN") && token.status === "PENDING") {
            return NextResponse.redirect(new URL("/admin-pending", req.url));
        }
        if (path.startsWith("/admin/admins") && role !== "SUPER_ADMIN") {
            return NextResponse.redirect(new URL("/admin/students", req.url));
        }
    }

    // ── /student/* : 관리자도 미리보기 가능 (학생 페이지 확인용) ──
    // ── /dashboard/*, /homework, /exams, /schedule, /study/* : 관리자가 접근하면 관리자 대시보드로 ──
    const dashboardPaths = ["/dashboard", "/homework", "/exams", "/schedule", "/study/"];
    const isDashboardPath = dashboardPaths.some((p) => path.startsWith(p));
    if (isDashboardPath && (role === "ADMIN" || role === "SUPER_ADMIN")) {
        return NextResponse.redirect(new URL("/admin/students", req.url));
    }

    // ── /parent/* : 관리자가 접근하면 관리자 대시보드로, 학생이 접근하면 차단 ──
    if (path.startsWith("/parent/")) {
        if (role === "ADMIN" || role === "SUPER_ADMIN") {
            return NextResponse.redirect(new URL("/admin/students", req.url));
        }
    }

    const response = NextResponse.next();
    for (const [key, value] of Object.entries(noCacheHeaders)) {
        response.headers.set(key, value);
    }
    return response;
}

export const config = {
    matcher: [
        "/admin/:path*",
        "/student/:path*",
        "/dashboard/:path*",
        "/homework/:path*",
        "/exams/:path*",
        "/schedule/:path*",
        "/study/:path*",
        "/parent/:path*",
    ],
};
