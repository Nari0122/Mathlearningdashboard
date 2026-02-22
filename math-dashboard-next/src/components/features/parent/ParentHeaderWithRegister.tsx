"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Label } from "@/components/ui/label";
import { linkChildToParent } from "@/actions/parent-actions";
import { UserPlus } from "lucide-react";

export function ParentHeaderWithRegister() {
    const router = useRouter();
    const { data: session } = useSession();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [form, setForm] = useState({
        studentName: "",
        studentPhone: "",
        parentPhone: "",
    });

    const uid = (session?.user as { sub?: string })?.sub ?? (session?.user as { id?: string })?.id;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!uid) {
            setError("로그인 정보가 없습니다.");
            return;
        }
        setError(null);
        setLoading(true);
        const result = await linkChildToParent(uid, {
            studentName: form.studentName.trim(),
            studentPhone: form.studentPhone,
            parentPhone: form.parentPhone,
        });
        setLoading(false);
        if (result.success) {
            setForm({ studentName: "", studentPhone: "", parentPhone: "" });
            setOpen(false);
            router.refresh();
        } else {
            setError(result.message ?? "연동에 실패했습니다.");
        }
    };

    return (
        <header className="flex items-center justify-between shrink-0 border-b border-gray-200 bg-white px-4 py-3 md:px-6">
            <h1 className="text-lg font-semibold text-gray-900">학부모 대시보드</h1>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <Button size="sm" className="gap-2">
                        <UserPlus className="h-4 w-4" />
                        자녀 등록
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>자녀 등록</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-gray-600">
                        학생 이름, 학생 전화번호, 학부모 전화번호가 모두 일치하는 경우에만 연동됩니다.
                    </p>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">
                                {error}
                            </p>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="studentName">학생 이름</Label>
                            <Input
                                id="studentName"
                                value={form.studentName}
                                onChange={(e) => setForm((f) => ({ ...f, studentName: e.target.value }))}
                                placeholder="학생 이름"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="studentPhone">학생 전화번호</Label>
                            <PhoneInput
                                id="studentPhone"
                                value={form.studentPhone}
                                onChange={(v) => setForm((f) => ({ ...f, studentPhone: v }))}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="parentPhone">학부모 전화번호</Label>
                            <PhoneInput
                                id="parentPhone"
                                value={form.parentPhone}
                                onChange={(v) => setForm((f) => ({ ...f, parentPhone: v }))}
                                required
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                취소
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? "연동 중..." : "연동하기"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </header>
    );
}
