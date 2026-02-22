import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { getAuthOptions } from "@/lib/auth";
import { studentService } from "@/services/studentService";
import { parentService } from "@/services/parentService";

/**
 * 로그인 후 최종 리다이렉트 (통합 로그인 Gatekeeping).
 * - Credentials(관리자): 세션 role/status로 getHomePathByRole 호출.
 * - OAuth: uid로 students/parents 조회 후 대시보드 또는 회원가입 완료 페이지로 이동.
 */
export async function GET() {
    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    try {
        const options = getAuthOptions(undefined);
        const session = await getServerSession(options);
        const uid = (session?.user as { sub?: string })?.sub ?? (session?.user as { id?: string })?.id;

        if (!session || !uid) {
            return NextResponse.redirect(new URL("/login", baseUrl));
        }

        const role = (session.user as { role?: string }).role;
        const status = (session.user as { status?: string }).status;

        if (role === "SUPER_ADMIN" || role === "ADMIN") {
            return NextResponse.redirect(new URL("/auth/admin-login-required", baseUrl));
        }

        const existingStudent = await studentService.getStudentByUid(uid);
        if (existingStudent) {
            const studentStatus = (existingStudent as { approvalStatus?: string }).approvalStatus;
            const path = studentStatus === "PENDING" ? "/pending-approval" : `/student/${existingStudent.id}`;
            return NextResponse.redirect(new URL(path, baseUrl));
        }

        const existingParent = await parentService.getParentByUid(uid);
        if (existingParent) {
            return NextResponse.redirect(new URL(`/parent/${uid}/dashboard`, baseUrl));
        }

        return NextResponse.redirect(new URL("/signup", baseUrl));
    } catch (e) {
        console.error("[api/auth/success] error:", e);
        return NextResponse.redirect(new URL("/login", baseUrl));
    }
}
