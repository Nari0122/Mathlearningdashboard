"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Label } from "@/components/ui/label";
import { createAdminAction } from "@/actions/admin-management-actions";

export function AdminLoginForm() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        if (!name.trim() || !phoneNumber.trim() || !username.trim() || !password) {
            setMessage({ type: "err", text: "이름, 전화번호, 아이디, 비밀번호를 모두 입력해 주세요." });
            return;
        }
        if (password !== confirmPassword) {
            setMessage({ type: "err", text: "비밀번호가 일치하지 않습니다." });
            return;
        }
        if (password.length < 6) {
            setMessage({ type: "err", text: "비밀번호는 6자 이상이어야 합니다." });
            return;
        }
        setLoading(true);
        const result = await createAdminAction({ name: name.trim(), phoneNumber, username: username.trim(), password });
        setLoading(false);
        if (result.success) {
            setMessage({ type: "ok", text: "가입이 완료되었습니다. Super Admin의 승인 후 로그인해 주세요." });
            setName("");
            setPhoneNumber("");
            setUsername("");
            setPassword("");
            setConfirmPassword("");
            setTimeout(() => router.push("/login"), 2000);
        } else {
            setMessage({ type: "err", text: result.message ?? "가입에 실패했습니다." });
        }
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
            <div className="space-y-2">
                <Label htmlFor="username">아이디 *</Label>
                <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="로그인 아이디"
                    required
                    disabled={loading}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="password">비밀번호 *</Label>
                <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="6자 이상"
                    required
                    disabled={loading}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="confirmPassword">비밀번호 확인 *</Label>
                <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="비밀번호 다시 입력"
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
                {loading ? "처리 중…" : "가입 신청"}
            </Button>
        </form>
    );
}
