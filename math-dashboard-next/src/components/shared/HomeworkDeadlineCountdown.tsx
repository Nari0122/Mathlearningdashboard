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
    const assignment: AssignmentDeadlineInfo = { dueDate, submissionDeadline, linkedScheduleId };

    const [state, setState] = useState(() => formatSubmissionDeadlineCountdown(assignment));

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
                state.open ? "text-blue-600 font-medium" : "text-gray-500",
                className
            )}
        >
            {state.label}
        </span>
    );
}
