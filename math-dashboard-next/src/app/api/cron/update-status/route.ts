import { NextResponse } from "next/server";
import { statusSchedulerService } from "@/services/statusSchedulerService";

/**
 * Cron에서 주기적으로 호출 (예: 1분 또는 5분마다).
 * 환경변수 CRON_SECRET과 요청 헤더 Authorization: Bearer <CRON_SECRET> 또는 x-cron-secret 일치 시에만 실행.
 */
export async function POST(request: Request) {
    const secret = process.env.CRON_SECRET;
    if (secret) {
        const authHeader = request.headers.get("authorization");
        const bearer = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
        const headerSecret = bearer || request.headers.get("x-cron-secret") || "";
        if (headerSecret !== secret) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
    }

    try {
        const result = await statusSchedulerService.runAll();
        return NextResponse.json({
            ok: true,
            assignmentsUpdated: result.assignmentsUpdated,
            schedulesUpdated: result.schedulesUpdated,
        });
    } catch (error) {
        console.error("Cron update-status error:", error);
        return NextResponse.json(
            { error: "Internal error", message: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}

/** GET은 헬스 체크용 (실제 업데이트는 POST만) */
export async function GET() {
    return NextResponse.json({ message: "Use POST with cron secret to run status updates." });
}
