"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { formatReviewDeadlineCountdown } from "@/lib/reviewSubmissionDeadline";

/** SSR과 클라이언트 시각 차이로 hydration mismatch 나지 않도록, 마운트 후에만 카운트다운 표시 */
export function ReviewDeadlineCountdownText({
    deadlineIso,
    className,
}: {
    deadlineIso: string;
    className?: string;
}) {
    const [snapshot, setSnapshot] = useState<{ open: boolean; label: string } | null>(null);

    useEffect(() => {
        const tick = () => setSnapshot(formatReviewDeadlineCountdown(deadlineIso));
        tick();
        const id = setInterval(tick, 30_000);
        return () => clearInterval(id);
    }, [deadlineIso]);

    if (!snapshot) {
        return (
            <p className={cn("text-xs font-medium text-muted-foreground", className)} aria-busy="true">
                남은 시간 계산 중…
            </p>
        );
    }

    return (
        <p
            className={cn(
                "text-xs font-medium",
                snapshot.open ? "text-blue-600" : "text-gray-500",
                className
            )}
        >
            {snapshot.label}
        </p>
    );
}
