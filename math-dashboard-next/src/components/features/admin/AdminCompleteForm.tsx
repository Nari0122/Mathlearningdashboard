"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Label } from "@/components/ui/label";
import { createAdminWithKakaoAction } from "@/actions/admin-management-actions";

interface AdminCompleteFormProps {
    uid: string;
}

export function AdminCompleteForm({ uid }: AdminCompleteFormProps) {
    const router = useRouter();
    const [name, setName] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        if (!name.trim() || !phoneNumber.trim()) {
            setMessage({ type: "err", text: "이름과 전화번호를 모두 입력해 주세요." });
            return;
        }
        setLoading(true);
        const result = await createAdminWithKakaoAction(uid, name.trim(), phoneNumber);
        setLoading(false);
        if (result.success) {
            router.push("/admin-pending");
            return;
        }
        setMessage({ type: "err", text: result.message ?? "가입 처리에 실패했습니다." });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="name">이름 *</Label>
                <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="이름"
                    required
                    disabled={loading}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="phoneNumber">전화번호 *</Label>
                <PhoneInput
                    id="phoneNumber"
                    value={phoneNumber}
                    onChange={setPhoneNumber}
                    required
                    disabled={loading}
                />
            </div>
            {message && (
                <p className={message.type === "ok" ? "text-sm text-green-600" : "text-sm text-red-600"}>
                    {message.text}
                </p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "처리 중…" : "가입하기"}
            </Button>
        </form>
    );
}
