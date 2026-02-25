"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
    title: string;
    description?: string;
    /** 아이콘 또는 왼쪽 상단에 올릴 컴포넌트 */
    icon?: ReactNode;
    /** 우측 액션 영역 (필터, 버튼 등) */
    actions?: ReactNode;
    className?: string;
}

export function PageHeader({ title, description, icon, actions, className }: PageHeaderProps) {
    return (
        <div
            className={cn(
                "flex flex-col gap-4 md:flex-row md:items-center md:justify-between",
                className
            )}
        >
            <div className="flex items-center gap-3">
                {icon && <div className="shrink-0">{icon}</div>}
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-gray-900 md:text-2xl">
                        {title}
                    </h1>
                    {description && (
                        <p className="mt-1 text-sm text-muted-foreground">
                            {description}
                        </p>
                    )}
                </div>
            </div>
            {actions && (
                <div className="flex flex-wrap items-center gap-2 md:justify-end">
                    {actions}
                </div>
            )}
        </div>
    );
}

