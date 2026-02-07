import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { getAuthOptions } from "@/lib/auth";
import { studentService } from "@/services/studentService";
import { parentService } from "@/services/parentService";

/**
 * OAuth 로그인 후 최종 리다이렉트: 세션의 uid로 students/parents 조회 후 올바른 대시보드로 이동.
 * callbackUrl을 이 경로로 두면 서버리스에서도 확실히 올바른 페이지로 보낼 수 있음.
 */
export async function GET() {
    const options = getAuthOptions(undefined);
    const session = await getServerSession(options);
    const uid = (session?.user as { sub?: string })?.sub ?? (session?.user as { id?: string })?.id;

    if (!session || !uid) {
        return NextResponse.redirect(new URL("/login", process.env.NEXTAUTH_URL ?? "http://localhost:3000"));
    }

    const existingStudent = await studentService.getStudentByUid(uid);
    if (existingStudent) {
        const status = (existingStudent as { approvalStatus?: string }).approvalStatus;
        const path = status === "PENDING" ? "/pending-approval" : `/student/${existingStudent.id}`;
        return NextResponse.redirect(new URL(path, process.env.NEXTAUTH_URL ?? "http://localhost:3000"));
    }

    const existingParent = await parentService.getParentByUid(uid);
    if (existingParent) {
        return NextResponse.redirect(new URL("/parent/dashboard", process.env.NEXTAUTH_URL ?? "http://localhost:3000"));
    }

    // 신규: 학생 추가정보 입력 페이지로
    return NextResponse.redirect(new URL("/signup/complete-student", process.env.NEXTAUTH_URL ?? "http://localhost:3000"));
}
