"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { registerStudentFromSignup, checkExistingUserByUid } from "@/actions/signup-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const SCHOOL_TYPES = [
    { value: "일반고", label: "일반고" },
    { value: "자사고", label: "자사고" },
    { value: "특목고", label: "특목고" },
    { value: "특성화고", label: "특성화고" },
    { value: "기타", label: "기타" },
];

const GRADES = [
    "초1", "초2", "초3", "중1", "중2", "중3", "고1", "고2", "고3", "N수",
];

/**
 * 학생 추가정보: 이름, 번호, 학교, 학교 형태, 학년, 학부모 연락처, 부/모 → Firestore students에 저장
 */
export default function CompleteStudentPage() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [form, setForm] = useState({
        name: "",
        phone: "",
        schoolName: "",
        schoolType: "",
        grade: "",
        parentPhone: "",
        parentRelation: "",
    });
    const [alreadyRegistered, setAlreadyRegistered] = useState<{ message: string; redirect: string } | null>(null);

    useEffect(() => {
        if (status !== "authenticated" || !session?.user) return;
        const uid = (session.user as { sub?: string })?.sub ?? (session.user as { id?: string })?.id;
        if (!uid) return;
        checkExistingUserByUid(uid).then((res) => {
            if (res.kind !== null) {
                setAlreadyRegistered({ message: res.message, redirect: res.redirect });
            }
        });
    }, [session?.user, status]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        const uid = (session?.user as { sub?: string })?.sub ?? (session?.user as { id?: string })?.id;
        if (!uid) {
            setError("로그인 세션이 없습니다. 카카오로 다시 로그인해 주세요.");
            return;
        }
        if (!form.name.trim() || !form.phone.trim() || !form.schoolName.trim() || !form.schoolType || !form.grade || !form.parentPhone.trim() || !form.parentRelation) {
            setError("모든 항목을 입력해 주세요.");
            return;
        }
        setLoading(true);
        const result = await registerStudentFromSignup({
            uid,
            name: form.name.trim(),
            phone: form.phone.trim(),
            schoolName: form.schoolName.trim(),
            schoolType: form.schoolType,
            grade: form.grade,
            parentPhone: form.parentPhone.trim(),
            parentRelation: form.parentRelation,
        });
        setLoading(false);
        if (result.success) {
            router.replace(result.redirect);
            return;
        }
        setError(result.message ?? "저장에 실패했습니다.");
    };

    if (status === "loading") {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
                <p className="text-gray-600">로딩 중...</p>
            </div>
        );
    }
    if (status !== "authenticated" || !session?.user) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle>로그인이 필요합니다</CardTitle>
                        <p className="text-sm text-gray-600">카카오 로그인 후 학생 추가정보를 입력해 주세요.</p>
                    </CardHeader>
                    <CardContent>
                        <Button asChild className="w-full">
                            <Link href="/signup/auth?role=STUDENT">학생 로그인</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (alreadyRegistered) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle>이미 가입된 계정입니다</CardTitle>
                        <p className="text-sm text-gray-600">{alreadyRegistered.message}</p>
                    </CardHeader>
                    <CardContent>
                        <Button asChild className="w-full">
                            <Link href={alreadyRegistered.redirect}>로그인 페이지로 이동</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>학생 추가 정보</CardTitle>
                    <p className="text-sm text-gray-600">
                        아래 항목을 입력한 뒤 저장하기를 눌러 주세요.
                    </p>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                                {error}
                            </p>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="name">이름</Label>
                            <Input
                                id="name"
                                value={form.name}
                                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                                placeholder="학생 이름"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone">번호</Label>
                            <Input
                                id="phone"
                                type="tel"
                                value={form.phone}
                                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                                placeholder="학생 연락처"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="schoolName">학교</Label>
                            <Input
                                id="schoolName"
                                value={form.schoolName}
                                onChange={(e) => setForm((f) => ({ ...f, schoolName: e.target.value }))}
                                placeholder="학교명"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>학교 형태</Label>
                            <Select
                                value={form.schoolType}
                                onValueChange={(v) => setForm((f) => ({ ...f, schoolType: v }))}
                                required
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="선택" />
                                </SelectTrigger>
                                <SelectContent>
                                    {SCHOOL_TYPES.map((t) => (
                                        <SelectItem key={t.value} value={t.value}>
                                            {t.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>학년</Label>
                            <Select
                                value={form.grade}
                                onValueChange={(v) => setForm((f) => ({ ...f, grade: v }))}
                                required
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="선택" />
                                </SelectTrigger>
                                <SelectContent>
                                    {GRADES.map((g) => (
                                        <SelectItem key={g} value={g}>
                                            {g}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="parentPhone">학부모 연락처</Label>
                            <Input
                                id="parentPhone"
                                type="tel"
                                value={form.parentPhone}
                                onChange={(e) => setForm((f) => ({ ...f, parentPhone: e.target.value }))}
                                placeholder="학부모 전화번호"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>부/모</Label>
                            <Select
                                value={form.parentRelation}
                                onValueChange={(v) => setForm((f) => ({ ...f, parentRelation: v }))}
                                required
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="선택" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="부">부</SelectItem>
                                    <SelectItem value="모">모</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex gap-2 pt-2">
                            <Button type="submit" className="flex-1" disabled={loading}>
                                {loading ? "저장 중..." : "저장하기"}
                            </Button>
                            <Button type="button" variant="outline" asChild>
                                <Link href="/signup">취소</Link>
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
