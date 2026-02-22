"use client";

import { ArrowLeft, User, Mail, Phone, Key, Save, ShieldAlert, Check, Copy, Trash2, AlertTriangle } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateStudent, deleteStudent, deleteStudentByDocId } from "@/actions/student-actions";
import { updateStudentAccountStatusAdmin } from "@/actions/account-actions";

/** getStudentDetail로 받은 학생 객체를 계정 관리 폼용으로 정규화 */
function normalizeStudent(raw: any) {
    const uid = raw?.uid ?? raw?.id;
    const status = raw?.status ?? "active";
    const isActive = status === "active" || status === "APPROVED";
    return {
        id: uid,
        name: raw?.name ?? "",
        grade: raw?.grade ?? "고1",
        class: (raw as any).class ?? "",
        email: raw?.email ?? "",
        phone: raw?.phone ?? "",
        loginId: raw?.loginId ?? raw?.username ?? "",
        isActive,
        progress: typeof raw?.progress === "number" ? raw.progress : 0,
        statusSummary: isActive ? "양호" : "비활성",
        lastUpdated: (raw as any).lastUpdated ?? raw?.createdAt ?? "",
    };
}

interface StudentAccountManagementClientProps {
    student: any;
    /** Firestore 문서 ID (비활성화/활성화 토글용) */
    studentDocId?: string;
}

export default function StudentAccountManagementClient({ student: rawStudent, studentDocId }: StudentAccountManagementClientProps) {
    const router = useRouter();
    const student = normalizeStudent(rawStudent);

    const [formData, setFormData] = useState({
        name: student.name,
        grade: student.grade,
        class: student.class || "",
        email: student.email,
        phone: student.phone,
        loginId: student.loginId,
        isActive: student.isActive,
    });

    const [newPassword, setNewPassword] = useState("");
    const [showPasswordReset, setShowPasswordReset] = useState(false);
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const accountStatus = (rawStudent as { accountStatus?: string })?.accountStatus ?? "ACTIVE";
    const isLoginBlocked = accountStatus === "INACTIVE";
    const docIdForStatus = studentDocId ?? (rawStudent as { docId?: string })?.docId;
    const [statusLoading, setStatusLoading] = useState(false);

    const handleCopy = (field: string, value: string) => {
        navigator.clipboard.writeText(value);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const generatePassword = () => {
        const randomPassword = Math.random().toString(36).slice(-8) + Math.floor(Math.random() * 100);
        setNewPassword(randomPassword);
    };

    const handleSave = async () => {
        setLoading(true);
        const res = await updateStudent(student.id, {
            name: formData.name,
            loginId: formData.loginId,
            grade: formData.grade,
            phone: formData.phone,
            email: formData.email,
            isActive: formData.isActive,
            ...(newPassword ? { password: newPassword } : {}),
            ...(typeof (rawStudent as any).schoolName !== "undefined" ? { schoolName: (rawStudent as any).schoolName } : {}),
            ...(typeof (rawStudent as any).parentPhone !== "undefined" ? { parentPhone: (rawStudent as any).parentPhone } : {}),
            ...(typeof (rawStudent as any).parentRelation !== "undefined" ? { parentRelation: (rawStudent as any).parentRelation } : {}),
            ...(typeof (rawStudent as any).enrollmentDate !== "undefined" ? { enrollmentDate: (rawStudent as any).enrollmentDate } : {}),
            ...(typeof (rawStudent as any).memo !== "undefined" ? { memo: (rawStudent as any).memo } : {}),
            ...(typeof (rawStudent as any).schoolType !== "undefined" ? { schoolType: (rawStudent as any).schoolType } : {}),
        });
        setLoading(false);

        if (res.success) {
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
            router.refresh();
        } else {
            alert(res.message ?? "저장에 실패했습니다.");
        }
    };

    const handleDelete = async () => {
        const docIdToDelete = studentDocId ?? (rawStudent as { docId?: string })?.docId;
        const res = docIdToDelete
            ? await deleteStudentByDocId(docIdToDelete)
            : await deleteStudent(student.id);
        if (res.success) {
            router.push("/admin/students");
            router.refresh();
        } else {
            alert(res.message ?? "삭제에 실패했습니다.");
        }
        setShowDeleteConfirm(false);
    };

    return (
        <div className="max-w-[1200px] mx-auto p-8">
            {/* Header */}
            <div className="mb-8">
                <Link
                    href={`/admin/students/${studentDocId ?? student.id}`}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4 inline-flex w-fit"
                >
                    <ArrowLeft size={20} />
                    <span>학생 목록으로 돌아가기</span>
                </Link>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                            <span className="text-3xl font-bold text-white">{student.name[0] || "?"}</span>
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">학생 계정 관리</h1>
                            <p className="text-gray-600 mt-1">{student.name}님의 정보 및 계정을 관리합니다.</p>
                        </div>
                    </div>

                    {saveSuccess && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg">
                            <Check size={20} />
                            <span className="font-medium">저장되었습니다</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Info Cards */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                            <User size={20} className="text-indigo-600" />
                            기본 정보
                        </h2>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    이름 <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    학년 <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.grade}
                                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                >
                                    <option value="중1">중1</option>
                                    <option value="중2">중2</option>
                                    <option value="중3">중3</option>
                                    <option value="고1">고1</option>
                                    <option value="고2">고2</option>
                                    <option value="고3">고3</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">반/조</label>
                                <input
                                    type="text"
                                    value={formData.class}
                                    onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="예: 1반"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                            <Mail size={20} className="text-indigo-600" />
                            연락처 정보
                        </h2>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">이메일</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">전화번호</label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                            <Key size={20} className="text-indigo-600" />
                            로그인 계정
                        </h2>
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">로그인 ID</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={formData.loginId}
                                        onChange={(e) => setFormData({ ...formData, loginId: e.target.value })}
                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleCopy("loginId", formData.loginId)}
                                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                    >
                                        {copiedField === "loginId" ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">학생이 로그인할 때 사용하는 아이디입니다.</p>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <label className="text-sm font-medium text-gray-700">비밀번호 재설정</label>
                                    <button
                                        type="button"
                                        onClick={() => setShowPasswordReset(!showPasswordReset)}
                                        className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                                    >
                                        {showPasswordReset ? "취소" : "비밀번호 변경"}
                                    </button>
                                </div>
                                {showPasswordReset && (
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                        <div className="flex items-start gap-2 mb-4">
                                            <ShieldAlert size={20} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                                            <div className="text-sm text-yellow-800">
                                                <p className="font-medium mb-1">비밀번호를 재설정하시겠습니까?</p>
                                                <p className="text-xs">새로운 비밀번호를 입력하여 저장 시 반영됩니다.</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 mb-3">
                                            <input
                                                type="text"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                placeholder="새 비밀번호"
                                                className="flex-1 px-4 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent font-mono"
                                            />
                                            <button
                                                type="button"
                                                onClick={generatePassword}
                                                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors whitespace-nowrap"
                                            >
                                                자동 생성
                                            </button>
                                            {newPassword && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleCopy("password", newPassword)}
                                                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                                >
                                                    {copiedField === "password" ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
                                                </button>
                                            )}
                                        </div>
                                        {newPassword && (
                                            <p className="text-xs text-yellow-700">
                                                저장 시 비밀번호가 변경됩니다. (백엔드에서 비밀번호 필드를 지원하는 경우)
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm p-6">
                        <h3 className="font-semibold text-gray-900 mb-4">계정 상태</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">계정 활성화</span>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.isActive}
                                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600" />
                                </label>
                            </div>
                            <div className={`p-3 rounded-lg ${formData.isActive ? "bg-green-50" : "bg-red-50"}`}>
                                <p className={`text-sm font-medium ${formData.isActive ? "text-green-900" : "text-red-900"}`}>
                                    {formData.isActive ? "✓ 활성화됨" : "✕ 비활성화됨"}
                                </p>
                                <p className={`text-xs mt-1 ${formData.isActive ? "text-green-700" : "text-red-700"}`}>
                                    {formData.isActive
                                        ? "학생이 로그인하여 시스템을 사용할 수 있습니다."
                                        : "학생은 현재 로그인할 수 없습니다."}
                                </p>
                            </div>
                            {docIdForStatus && (
                                <div className="border-t border-gray-200 pt-4 space-y-3">
                                    <p className="text-sm text-gray-600">로그인 차단(비활성화) 시 학생은 로그인할 수 없으며, 오답 노트·숙제 등 데이터는 유지됩니다.</p>
                                    <div className={`p-3 rounded-lg ${isLoginBlocked ? "bg-amber-50" : "bg-green-50"}`}>
                                        <p className={`text-sm font-medium ${isLoginBlocked ? "text-amber-900" : "text-green-900"}`}>
                                            {isLoginBlocked ? "로그인 차단됨" : "로그인 허용"}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        disabled={statusLoading}
                                        onClick={async () => {
                                            setStatusLoading(true);
                                            const res = await updateStudentAccountStatusAdmin(docIdForStatus, isLoginBlocked ? "ACTIVE" : "INACTIVE");
                                            setStatusLoading(false);
                                            if (res.success) {
                                                router.refresh();
                                            } else {
                                                alert(res.message ?? "변경 실패");
                                            }
                                        }}
                                        className={`w-full py-2 rounded-lg text-sm font-medium min-h-[44px] ${isLoginBlocked ? "bg-green-600 hover:bg-green-700 text-white" : "bg-amber-600 hover:bg-amber-700 text-white"}`}
                                    >
                                        {statusLoading ? "처리 중..." : isLoginBlocked ? "로그인 허용으로 변경" : "로그인 차단(비활성화)"}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm p-6">
                        <h3 className="font-semibold text-gray-900 mb-4">학습 현황</h3>
                        <div className="space-y-3">
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-gray-600">전체 진도</span>
                                    <span className="text-sm font-semibold text-gray-900">{student.progress}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
                                        style={{ width: `${student.progress}%` }}
                                    />
                                </div>
                            </div>
                            <div className="pt-3 border-t border-gray-200">
                                <p className="text-xs text-gray-500 mb-1">상태 요약</p>
                                <p className="text-sm font-medium text-gray-900">{student.statusSummary}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 mb-1">최근 업데이트</p>
                                <p className="text-sm font-medium text-gray-900">{student.lastUpdated || "-"}</p>
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50"
                    >
                        <Save size={20} />
                        {loading ? "저장 중..." : "변경사항 저장"}
                    </button>

                    <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(true)}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                    >
                        <Trash2 size={20} />
                        계정 삭제
                    </button>

                    {showDeleteConfirm && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                            <div className="bg-white rounded-lg p-6 text-center max-w-sm mx-4">
                                <AlertTriangle size={40} className="text-red-500 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-gray-900 mb-4">계정 삭제 확인</h3>
                                <p className="text-sm text-gray-600 mb-6">정말로 이 학생 계정을 삭제하시겠습니까?</p>
                                <div className="flex items-center justify-center gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowDeleteConfirm(false)}
                                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                                    >
                                        취소
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleDelete}
                                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                    >
                                        삭제
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
