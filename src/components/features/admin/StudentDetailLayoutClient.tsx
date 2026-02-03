"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Settings } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateStudent } from "@/actions/student-actions";

interface StudentDetailLayoutClientProps {
    children: React.ReactNode;
    studentId: string;
    studentName: string;
    student: any;
}

export default function StudentDetailLayoutClient({
    children,
    studentId,
    studentName,
    student,
}: StudentDetailLayoutClientProps) {
    const pathname = usePathname();
    const router = useRouter();

    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [editFormData, setEditFormData] = useState({
        name: student.name,
        loginId: student.loginId,
        password: "",
        grade: student.grade || "고1",
        phone: student.phone || "",
        email: student.email || "",
        parentPhone: student.parentPhone || "",
        parentRelation: student.parentRelation || "부",
        schoolName: student.schoolName || "",
        schoolType: student.schoolType || "일반고",
        enrollmentDate: student.enrollmentDate || "",
        memo: student.memo || "",
    });

    const handleEditSave = async () => {
        setIsLoading(true);
        const res = await updateStudent(parseInt(studentId), editFormData);
        setIsLoading(false);

        if (res.success) {
            alert("학생 정보가 수정되었습니다.");
            setIsEditOpen(false);
            router.refresh();
        } else {
            alert(res.message);
        }
    };

    const tabs = [
        { href: `/admin/students/${studentId}`, label: "대시보드", exact: true },
        { href: `/admin/students/${studentId}/learning`, label: "나의 학습" },
        { href: `/admin/students/${studentId}/analysis`, label: "오답 분석" },
        { href: `/admin/students/${studentId}/report`, label: "통계 리포트" },
        { href: `/admin/students/${studentId}/history`, label: "학습 기록" },
        { href: `/admin/students/${studentId}/schedule`, label: "수업 일정" },
        { href: `/admin/students/${studentId}/homework`, label: "숙제 관리" },
        { href: `/admin/students/${studentId}/exams`, label: "시험 성적" },
        { href: `/admin/students/${studentId}/incorrect-notes`, label: "오답 노트" },
    ];

    return (
        <div className="space-y-6">
            {/* Header with Back Button and Student Info */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/students">
                        <Button variant="outline" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">{studentName} 학생</h1>
                        <p className="text-sm text-muted-foreground">학생 상세 정보 및 학습 관리</p>
                    </div>
                </div>
                <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline">
                            <Settings className="mr-2 h-4 w-4" />
                            계정 관리
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[700px] border-none shadow-2xl overflow-y-auto max-h-[85vh]">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold">학생 정보 수정</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-6 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-name">이름</Label>
                                    <Input id="edit-name" value={editFormData.name} onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })} className="h-10" />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-id">아이디</Label>
                                    <Input id="edit-id" value={editFormData.loginId} onChange={(e) => setEditFormData({ ...editFormData, loginId: e.target.value })} className="h-10" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-password">비밀번호 (변경 시 입력)</Label>
                                    <Input id="edit-password" type="password" placeholder="변경하려면 입력하세요" value={editFormData.password} onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })} className="h-10" />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-enrollmentDate">등록일</Label>
                                    <Input id="edit-enrollmentDate" type="date" value={editFormData.enrollmentDate} onChange={(e) => setEditFormData({ ...editFormData, enrollmentDate: e.target.value })} className="h-10" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>학년</Label>
                                    <Select value={editFormData.grade} onValueChange={(val) => setEditFormData({ ...editFormData, grade: val })}>
                                        <SelectTrigger className="h-10">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="중1">중1</SelectItem>
                                            <SelectItem value="중2">중2</SelectItem>
                                            <SelectItem value="중3">중3</SelectItem>
                                            <SelectItem value="고1">고1</SelectItem>
                                            <SelectItem value="고2">고2</SelectItem>
                                            <SelectItem value="고3">고3</SelectItem>
                                            <SelectItem value="N수">N수</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-phone">연락처</Label>
                                    <Input id="edit-phone" value={editFormData.phone} onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })} className="h-10" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-schoolName">학교명</Label>
                                    <Input id="edit-schoolName" value={editFormData.schoolName} onChange={(e) => setEditFormData({ ...editFormData, schoolName: e.target.value })} className="h-10" />
                                </div>
                                <div className="grid gap-2">
                                    <Label>학교 유형</Label>
                                    <Select value={editFormData.schoolType} onValueChange={(val) => setEditFormData({ ...editFormData, schoolType: val })}>
                                        <SelectTrigger className="h-10">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="일반고">일반고</SelectItem>
                                            <SelectItem value="자사고">자사고</SelectItem>
                                            <SelectItem value="특목고">특목고</SelectItem>
                                            <SelectItem value="특성화고">특성화고</SelectItem>
                                            <SelectItem value="기타">기타</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label>학부모 연락처</Label>
                                <div className="flex gap-2">
                                    <Select
                                        value={editFormData.parentRelation}
                                        onValueChange={(val) => setEditFormData({ ...editFormData, parentRelation: val })}
                                    >
                                        <SelectTrigger className="w-[80px] h-10">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="부">부</SelectItem>
                                            <SelectItem value="모">모</SelectItem>
                                            <SelectItem value="조부">조부</SelectItem>
                                            <SelectItem value="조모">조모</SelectItem>
                                            <SelectItem value="기타">기타</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Input
                                        className="flex-1 h-10"
                                        placeholder="010-0000-0000"
                                        value={editFormData.parentPhone}
                                        onChange={(e) => setEditFormData({ ...editFormData, parentPhone: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="edit-memo">특이사항 (Memo)</Label>
                                <Input
                                    id="edit-memo"
                                    value={editFormData.memo}
                                    onChange={(e) => setEditFormData({ ...editFormData, memo: e.target.value })}
                                    className="h-20"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsEditOpen(false)} className="h-10">취소</Button>
                            <Button onClick={handleEditSave} disabled={isLoading} className="h-10 bg-blue-600 hover:bg-blue-700">
                                {isLoading ? "수정 중..." : "수정완료"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    {tabs.map((tab) => {
                        const isActive = tab.exact
                            ? pathname === tab.href
                            : pathname.startsWith(tab.href);

                        return (
                            <Link
                                key={tab.href}
                                href={tab.href}
                                className={cn(
                                    "whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors",
                                    isActive
                                        ? "border-blue-500 text-blue-600"
                                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                )}
                            >
                                {tab.label}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* Content */}
            <div className="py-4">
                {children}
            </div>
        </div>
    );
}
