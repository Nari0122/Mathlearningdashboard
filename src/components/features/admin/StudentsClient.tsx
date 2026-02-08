"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, User, Phone, Users, Clock, UserCheck } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { updateStudentByDocId, updateStudentStatusByDocId, deleteStudentByDocId, approveStudentByDocId } from "@/actions/student-actions";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PhoneInput } from "@/components/ui/phone-input";
import { getPhoneDigits, formatPhoneDisplay } from "@/lib/phone";
import { Edit } from "lucide-react";

interface StudentsClientProps {
    initialStudents: any[];
}

export default function StudentsClient({ initialStudents }: StudentsClientProps) {
    const router = useRouter();
    const [students, setStudents] = useState(initialStudents);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

    const [isLoading, setIsLoading] = useState(false);
    const [isPendingModalOpen, setIsPendingModalOpen] = useState(false);

    // Edit Student State
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editFormData, setEditFormData] = useState({
        name: "",
        loginId: "",
        grade: "고1",
        phone: "",
        parentPhone: "",
        parentRelation: "부",
        schoolName: "",
        schoolType: "일반고",
        enrollmentDate: "",
        memo: "",
    });

    const approvedStudents = initialStudents.filter(
        (s: any) => s.approvalStatus !== "PENDING"
    );
    const pendingStudents = initialStudents.filter(
        (s: any) => s.approvalStatus === "PENDING"
    );

    const filteredStudents = approvedStudents.filter(s => {
        if (statusFilter === "active" && !s.isActive) return false;
        if (statusFilter === "inactive" && s.isActive) return false;
        const matchesSearch =
            (s.name && s.name.includes(searchTerm)) ||
            (s.loginId && s.loginId.includes(searchTerm)) ||
            (s.username && String(s.username).includes(searchTerm)) ||
            (s.phone && s.phone.includes(searchTerm)) ||
            (s.schoolName && s.schoolName.includes(searchTerm));
        return matchesSearch;
    });

    const totalStudents = approvedStudents.length;
    const activeStudents = approvedStudents.filter(s => s.isActive).length;
    const averageProgress = totalStudents > 0
        ? Math.round(approvedStudents.reduce((acc, s) => acc + (s.progress || 0), 0) / totalStudents)
        : 0;

    const handleApprove = async (docId: string) => {
        setIsLoading(true);
        const res = await approveStudentByDocId(docId);
        setIsLoading(false);
        if (res.success) {
            router.refresh();
        } else {
            alert(res.message);
        }
    };

    const handleEditClick = (student: any) => {
        setEditingId(student.docId);
        setEditFormData({
            name: student.name,
            loginId: student.loginId,
            grade: student.grade,
            phone: getPhoneDigits(student.phone || ""),
            parentPhone: getPhoneDigits(student.parentPhone || ""),
            parentRelation: student.parentRelation || "부",
            schoolName: student.schoolName || "",
            schoolType: student.schoolType || "일반고",
            enrollmentDate: student.enrollmentDate || "",
            memo: student.memo || "",
        });
        setIsEditOpen(true);
    };

    const handleEditSave = async () => {
        if (!editingId) return;
        setIsLoading(true);
        const res = await updateStudentByDocId(editingId, editFormData);
        setIsLoading(false);

        if (res.success) {
            alert("학생 정보가 수정되었습니다.");
            setIsEditOpen(false);
            setEditingId(null);
            router.refresh();
        } else {
            alert(res.message);
        }
    };

    const handleToggleStatus = async (docId: string, currentStatus: boolean) => {
        const confirmMessage = currentStatus
            ? "학생 계정을 비활성화하시겠습니까?\n\n• 로그인이 제한됩니다\n• 기존 학습 데이터는 삭제되지 않습니다\n• 관리자 페이지에서 계속 조회 가능합니다\n• 추후 재활성화가 가능합니다"
            : "학생 계정을 활성화하시겠습니까?\n\n• 기존 ID/PW로 즉시 로그인 가능합니다\n• 모든 학습 데이터가 그대로 유지됩니다";

        if (!confirm(confirmMessage)) {
            return;
        }

        const res = await updateStudentStatusByDocId(docId, !currentStatus);
        if (res.success) {
            router.refresh();
        } else {
            alert(res.message);
        }
    };

    const handleDeleteStudent = async () => {
        if (!editingId) return;

        const confirmMessage = "학생 정보를 영구적으로 삭제하시겠습니까?\n\n• 이 작업은 되돌릴 수 없습니다.\n• 모든 학습 데이터와 기록이 삭제될 수 있습니다.\n• 계속하시려면 학생의 이름을 입력해주세요.";

        if (!confirm(confirmMessage)) return;

        const studentName = editFormData.name;
        const inputName = prompt(`삭제 확인을 위해 학생 이름 [${studentName}]을 입력해주세요:`);

        if (inputName !== studentName) {
            alert("이름이 일치하지 않아 삭제가 취소되었습니다.");
            return;
        }

        setIsLoading(true);
        const res = await deleteStudentByDocId(editingId);
        setIsLoading(false);

        if (res.success) {
            alert("학생 정보가 영구 삭제되었습니다.");
            setIsEditOpen(false);
            setEditingId(null);
            router.refresh();
        } else {
            alert(res.message);
        }
    };

    return (
        <div className="space-y-8 p-6 max-w-[1600px] mx-auto">
            {/* Header / Stats Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-gradient-to-br from-blue-500 to-blue-600 border-none shadow-lg text-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-blue-100">총 학생 수</CardTitle>
                        <Users className="h-4 w-4 text-blue-100" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{totalStudents}명</div>
                        <p className="text-xs text-blue-100 mt-1">
                            +{activeStudents}명 활동 중
                        </p>
                    </CardContent>
                </Card>
                <Card className="bg-white hover:bg-gray-50 transition-colors shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">최근 업데이트</CardTitle>
                        <Clock className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-gray-900">오늘</div>
                        <p className="text-xs text-gray-400 mt-1">실시간 학습 현황 반영 중</p>
                    </CardContent>
                </Card>
            </div>

            {/* Actions Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    {/* Status Filter Buttons */}
                    <div className="flex bg-gray-100 rounded-lg p-1">
                        <button
                            onClick={() => setStatusFilter("all")}
                            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${statusFilter === "all"
                                ? "bg-white shadow text-gray-900 font-medium"
                                : "text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            전체
                        </button>
                        <button
                            onClick={() => setStatusFilter("active")}
                            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${statusFilter === "active"
                                ? "bg-white shadow text-green-600 font-medium"
                                : "text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            활성화
                        </button>
                        <button
                            onClick={() => setStatusFilter("inactive")}
                            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${statusFilter === "inactive"
                                ? "bg-white shadow text-gray-600 font-medium"
                                : "text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            비활성화
                        </button>
                    </div>

                    {/* Search Input */}
                    <div className="relative flex-1 sm:w-[350px]">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="이름, 학교, 전화번호로 검색..."
                            className="pl-10 h-11 bg-white border-gray-200 focus:border-blue-500 rounded-xl shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <Dialog open={isPendingModalOpen} onOpenChange={setIsPendingModalOpen}>
                    <DialogTrigger asChild>
                        <Button className="w-full sm:w-auto h-11 px-6 bg-gray-900 hover:bg-gray-800 text-white rounded-xl shadow-md transition-all hover:shadow-lg">
                            <UserCheck className="mr-2 h-4 w-4" />
                            승인 대기
                            {pendingStudents.length > 0 && (
                                <span className="ml-2 bg-amber-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                                    {pendingStudents.length}
                                </span>
                            )}
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px] border-none shadow-2xl overflow-y-auto max-h-[85vh]">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold">승인 대기 (카카오/회원가입 학생)</DialogTitle>
                            <p className="text-sm text-gray-500">PENDING → APPROVED로 변경하면 서비스 이용이 가능합니다.</p>
                        </DialogHeader>
                        <div className="py-4">
                            {pendingStudents.length === 0 ? (
                                <p className="text-gray-500 text-center py-8">승인 대기 중인 학생이 없습니다.</p>
                            ) : (
                                <ul className="space-y-3">
                                    {pendingStudents.map((s: any) => (
                                        <li
                                            key={s.docId}
                                            className="flex items-center justify-between gap-4 p-4 rounded-xl border border-gray-200 bg-gray-50"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                                                    <User className="h-5 w-5 text-gray-500" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-medium text-gray-900 truncate">{s.name}</p>
                                                    <p className="text-sm text-gray-500 truncate">
                                                        {s.schoolName || "학교 미등록"}
                                                        {s.phone ? ` · ${formatPhoneDisplay(s.phone)}` : ""}
                                                    </p>
                                                </div>
                                            </div>
                                            <Button
                                                size="sm"
                                                onClick={() => handleApprove(s.docId)}
                                                disabled={isLoading}
                                                className="flex-shrink-0 bg-blue-600 hover:bg-blue-700"
                                            >
                                                승인
                                            </Button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsPendingModalOpen(false)} className="h-10">
                                닫기
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Student Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredStudents.length > 0 ? filteredStudents.map((student) => (
                    <div
                        key={student.docId}
                        className="group relative bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all duration-300 cursor-pointer overflow-hidden"
                        onClick={() => window.location.href = `/admin/students/${student.docId}`}
                    >
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-purple-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />

                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                                    <User size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors text-lg">{student.name}</h3>
                                    <p className="text-xs text-gray-400">{student.grade} • {student.schoolName || "학교 미등록"}</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Phone size={14} />
                                <span>{student.phone ? formatPhoneDisplay(student.phone) : "연락처 없음"}</span>
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-gray-50 flex justify-between items-center">
                            <Badge
                                variant={student.isActive ? "default" : "destructive"}
                                className={`cursor-pointer hover:opacity-80 transition-opacity ${!student.isActive ? 'bg-gray-500' : ''}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleStatus(student.docId, student.isActive);
                                }}
                            >
                                {student.isActive ? "활성화" : "비활성화"}
                            </Badge>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditClick(student);
                                }}
                                className="text-xs text-gray-400 flex items-center gap-1 hover:text-blue-600 transition-colors"
                            >
                                <Edit size={12} />
                                학생 수정
                            </button>
                        </div>
                    </div>
                )) : (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                            <Search className="w-8 h-8 text-gray-300" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">검색 결과가 없습니다</h3>
                        <p className="text-gray-500 mt-1">다른 검색어를 입력하거나 새로운 학생을 등록해보세요.</p>
                    </div>
                )}
            </div>

            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
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

                        <div className="grid gap-2">
                            <Label htmlFor="edit-enrollmentDate">등록일</Label>
                            <Input id="edit-enrollmentDate" type="date" value={editFormData.enrollmentDate} onChange={(e) => setEditFormData({ ...editFormData, enrollmentDate: e.target.value })} className="h-10" />
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
                    <DialogFooter className="flex justify-between items-center sm:justify-between">
                        <Button
                            variant="ghost"
                            onClick={handleDeleteStudent}
                            disabled={isLoading}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                            학생 영구 삭제
                        </Button>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setIsEditOpen(false)} className="h-10">취소</Button>
                            <Button onClick={handleEditSave} disabled={isLoading} className="h-10 bg-blue-600 hover:bg-blue-700">
                                {isLoading ? "수정 중..." : "수정완료"}
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
