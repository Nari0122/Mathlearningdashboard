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
import { PhoneInput } from "@/components/ui/phone-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getPhoneDigits } from "@/lib/phone";
import { updateStudentByDocId } from "@/actions/student-actions";

interface StudentDetailLayoutClientProps {
    children: React.ReactNode;
    studentDocId: string;
    studentName: string;
    student: any;
}

export default function StudentDetailLayoutClient({
    children,
    studentDocId,
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
        grade: student.grade || "고1",
        phone: getPhoneDigits(student.phone || ""),
        parentPhone: getPhoneDigits(student.parentPhone || ""),
        parentRelation: student.parentRelation || "부",
        schoolName: student.schoolName || "",
        schoolType: student.schoolType || "일반고",
        enrollmentDate: student.enrollmentDate || "",
        memo: student.memo || "",
    });

    const handleEditSave = async () => {
        setIsLoading(true);
        const res = await updateStudentByDocId(studentDocId, editFormData);
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
        { href: `/admin/students/${studentDocId}`, label: "대시보드", exact: true },
        { href: `/admin/students/${studentDocId}/learning`, label: "나의 학습" },
        { href: `/admin/students/${studentDocId}/analysis`, label: "오답 분석" },
        { href: `/admin/students/${studentDocId}/report`, label: "통계 리포트" },
        { href: `/admin/students/${studentDocId}/history`, label: "학습 기록" },
        { href: `/admin/students/${studentDocId}/schedule`, label: "수업 일정" },
        { href: `/admin/students/${studentDocId}/homework`, label: "숙제 관리" },
        { href: `/admin/students/${studentDocId}/exams`, label: "시험 성적" },
        { href: `/admin/students/${studentDocId}/incorrect-notes`, label: "오답 노트" },
        { href: `/admin/students/${studentDocId}/account`, label: "계정" },
    ];

    return (
        <div className="space-y-4">
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
                            <div className="grid gap-2">
                                <Label htmlFor="edit-name">이름</Label>
                                <Input id="edit-name" value={editFormData.name} onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })} className="h-10" />
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
                                    <PhoneInput id="edit-phone" value={editFormData.phone} onChange={(v) => setEditFormData({ ...editFormData, phone: v })} className="h-10" />
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
                                    <PhoneInput
                                        className="flex-1 h-10"
                                        value={editFormData.parentPhone}
                                        onChange={(v) => setEditFormData({ ...editFormData, parentPhone: v })}
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
            <div className="border-b border-gray-200 overflow-x-auto scrollbar-hide">
                <nav className="-mb-px flex space-x-8 min-w-max px-4" aria-label="Tabs">
                    {tabs.map((tab) => {
                        const isActive = tab.exact
                            ? pathname === tab.href
                            : (pathname && pathname.startsWith(tab.href));

                        return (
                            <Link
                                key={tab.href}
                                href={tab.href}
                                className={cn(
                                    "whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors",
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

            {/* Content - 상단 여백 최소화 (탭과 페이지 제목 사이) */}
            <div className="pt-2 pb-4">
                {children}
            </div>
        </div>
    );
}
