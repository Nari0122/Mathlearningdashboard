"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { formatSubmissionDeadlineCountdown, type AssignmentDeadlineInfo } from "@/lib/submissionDeadline";

type Props = {
    dueDate: string;
    submissionDeadline?: string | null;
    linkedScheduleId?: string | null;
    className?: string;
};

export function HomeworkDeadlineCountdown({ dueDate, submissionDeadline, linkedScheduleId, className }: Props) {
    const [state, setState] = useState<{ open: boolean; label: string } | null>(null);

    useEffect(() => {
        const a: AssignmentDeadlineInfo = { dueDate, submissionDeadline, linkedScheduleId };
        const tick = () => setState(formatSubmissionDeadlineCountdown(a));
        tick();
        const id = setInterval(tick, 30_000);
        return () => clearInterval(id);
    }, [dueDate, submissionDeadline, linkedScheduleId]);

    return (
        <span
            className={cn(
                "tabular-nums",
                state ? (state.open ? "text-blue-600 font-medium" : "text-gray-500") : "text-muted-foreground",
                className
            )}
            aria-busy={state === null}
        >
            {state ? state.label : "남은 시간 계산 중…"}
        </span>
    );
}
