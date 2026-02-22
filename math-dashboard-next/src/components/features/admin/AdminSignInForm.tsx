"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** 관리자 전용 아이디/비밀번호 로그인 (Credentials) */
export function AdminSignInForm() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage("");
        if (!username.trim() || !password) {
            setMessage("아이디와 비밀번호를 입력해 주세요.");
            return;
        }
        setLoading(true);
        try {
            const res = await signIn("credentials", {
                username: username.trim(),
                password,
                redirect: false,
                callbackUrl: "/api/auth/success",
            });
            if (res?.error) {
                setMessage("아이디 또는 비밀번호가 올바르지 않습니다.");
                setLoading(false);
                return;
            }
            if (res?.url) window.location.href = res.url;
            else window.location.href = "/api/auth/success";
        } catch {
            setMessage("로그인 처리 중 오류가 발생했습니다.");
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="admin-username">아이디</Label>
                <Input
                    id="admin-username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="아이디"
                    autoComplete="username"
                    disabled={loading}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="admin-password">비밀번호</Label>
                <Input
                    id="admin-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="비밀번호"
                    autoComplete="current-password"
                    disabled={loading}
                />
            </div>
            {message && <p className="text-sm text-red-600">{message}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "로그인 중…" : "로그인"}
            </Button>
        </form>
    );
}
