"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

const ERROR_MESSAGES: Record<string, { title: string; description: string }> = {
    session_required: {
        title: "로그인 세션을 확인할 수 없습니다",
        description:
            "카카오 로그인이 취소되었거나, 로그인 처리 중 오류가 발생했을 수 있습니다. 다시 시도해 주세요.",
    },
    oauth_failed: {
        title: "카카오 로그인에 실패했습니다",
        description:
            "카카오 로그인 중 오류가 발생했습니다. 네트워크 연결을 확인하거나 잠시 후 다시 시도해 주세요.",
    },
    student_or_parent: {
        title: "관리자 계정이 아닙니다",
        description:
            "해당 계정은 학생 또는 학부모로 등록되어 있습니다. 관리자 로그인을 사용할 수 없습니다. 학생/학부모 로그인 화면에서 이용해 주세요.",
    },
};

export function AdminLoginErrorPopup({ error }: { error: string | undefined }) {
    const router = useRouter();
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (error && ERROR_MESSAGES[error]) {
            setOpen(true);
        }
    }, [error]);

    const handleClose = () => {
        setOpen(false);
        router.replace("/admin-login", { scroll: false });
    };

    const config = error ? ERROR_MESSAGES[error] : null;
    if (!config) return null;

    return (
        <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
            <DialogContent showCloseButton={false} className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-3 text-amber-800">
                        <AlertCircle className="w-8 h-8 shrink-0 text-amber-600" />
                        <div>
                            <DialogTitle>{config.title}</DialogTitle>
                            <DialogDescription className="mt-2 text-amber-700">
                                {config.description}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>
                <DialogFooter className="sm:justify-center">
                    <Button onClick={handleClose}>확인</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
