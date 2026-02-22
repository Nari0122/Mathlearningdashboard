import { NextResponse } from "next/server";
import { getNextAuthSecret } from "@/lib/auth";

/** NEXTAUTH_SECRET 디버그용 - 실제 값 노출 없이 확인 */
export async function GET() {
    const hasEvalSecret = (() => {
        try {
            return !!(eval("process.env.NEXTAUTH_SECRET") as string | undefined);
        } catch {
            return false;
        }
    })();
    const hasEvalAuthSecret = (() => {
        try {
            return !!(eval("process.env.AUTH_SECRET") as string | undefined);
        } catch {
            return false;
        }
    })();
    const fromGetNextAuthSecret = !!getNextAuthSecret();
    // AUTH/SECRET 관련 env 키 목록 (값 노출 없음) - Vercel에 잘못된 이름으로 저장됐는지 확인
    const authRelatedKeys = Object.keys(process.env).filter(
        (k) => k.includes("AUTH") || k.includes("SECRET") || k.includes("NEXTAUTH")
    );
    const nextAuthUrl = process.env.NEXTAUTH_URL ?? "";
    const urlOk = nextAuthUrl.startsWith("https://") && !nextAuthUrl.includes("localhost");
    return NextResponse.json({
        NEXTAUTH_SECRET_exists: hasEvalSecret,
        AUTH_SECRET_exists: hasEvalAuthSecret,
        getNextAuthSecret_hasValue: fromGetNextAuthSecret,
        authRelatedEnvKeys: authRelatedKeys,
        NEXTAUTH_URL_isProduction: urlOk,
    });
}
