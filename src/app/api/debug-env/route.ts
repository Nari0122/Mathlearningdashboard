import { NextResponse } from "next/server";
import { getNextAuthSecret } from "@/lib/auth";

/** NEXTAUTH_SECRET 디버그용 - 실제 값 노출 없이 존재 여부만 확인 */
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
    return NextResponse.json({
        NEXTAUTH_SECRET_exists: hasEvalSecret,
        AUTH_SECRET_exists: hasEvalAuthSecret,
        getNextAuthSecret_hasValue: fromGetNextAuthSecret,
    });
}
