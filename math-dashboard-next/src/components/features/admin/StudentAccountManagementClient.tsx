"use client";

import { User, Mail, Phone, Key, Save, Check, Copy, Trash2, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteStudentByDocId, updateStudentByDocId } from "@/actions/student-actions";
import { updateStudentAccountStatusAdmin } from "@/actions/account-actions";

/** getStudentDetail로 받은 학생 객체를 계정 관리 폼용으로 정규화 */
function normalizeStudent(raw: any) {
    const uid = raw?.uid ?? raw?.id;
    const status = raw?.status ?? "active";
    const isActive = status === "active" || status === "APPROVED";
    return {
        id: uid,
        kakaoUid: (raw as any).docId ?? raw?.uid ?? "",
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
    linkedParents?: { uid: string; name: string; phoneNumber?: string }[];
}

export default function StudentAccountManagementClient({ student: rawStudent, studentDocId, linkedParents = [] }: StudentAccountManagementClientProps) {
    const router = useRouter();
    const student = normalizeStudent(rawStudent);

    const [formData, setFormData] = useState({
        name: student.name,
        grade: student.grade,
        class: student.class || "",
        email: student.email,
        phone: student.phone,
        schoolName: (rawStudent as any).schoolName ?? "",
        schoolType: (rawStudent as any).schoolType ?? "일반고",
        parentRelation: (rawStudent as any).parentRelation ?? "부",
        parentPhone: (rawStudent as any).parentPhone ?? "",
        enrollmentDate: (rawStudent as any).enrollmentDate ?? "",
        memo: (rawStudent as any).memo ?? "",
    });

    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const initialAccountStatus = (rawStudent as { accountStatus?: string })?.accountStatus ?? "ACTIVE";
    const [visualAccountStatus, setVisualAccountStatus] = useState(initialAccountStatus);
    const isLoginBlocked = visualAccountStatus === "INACTIVE";
    const docIdForStatus = studentDocId ?? (rawStudent as { docId?: string })?.docId;

    const handleCopy = (field: string, value: string) => {
        navigator.clipboard.writeText(value);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const handleSave = () => {
        const docIdToUse = studentDocId ?? (rawStudent as { docId?: string })?.docId;
        if (!docIdToUse) {
            alert("학생 문서 ID를 찾을 수 없습니다.");
            return;
        }
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        updateStudentByDocId(docIdToUse, {
            name: formData.name,
            loginId: student.kakaoUid || student.loginId || "",
            grade: formData.grade,
            phone: formData.phone,
            email: formData.email,
            schoolName: formData.schoolName,
            parentPhone: formData.parentPhone,
            parentRelation: formData.parentRelation,
            enrollmentDate: formData.enrollmentDate,
            memo: formData.memo,
            schoolType: formData.schoolType,
        }).then((res) => {
            if (res.success) {
                router.refresh();
            } else {
                setSaveSuccess(false);
                alert(res.message ?? "저장에 실패했습니다.");
            }
        });
    };

    const handleDelete = () => {
        const docIdToDelete = studentDocId ?? (rawStudent as { docId?: string })?.docId;
        if (!docIdToDelete) {
            alert("학생 문서 ID를 찾을 수 없습니다.");
            return;
        }
        setShowDeleteConfirm(false);
        deleteStudentByDocId(docIdToDelete).then((res) => {
            if (res.success) {
                router.push("/admin/students");
                router.refresh();
            } else {
                alert(res.message ?? "삭제에 실패했습니다.");
            }
        });
    };

    return (
        <div className="max-w-[1200px] mx-auto px-6 pt-2 pb-8 space-y-6 text-sm leading-relaxed">
            {saveSuccess && (
                <div className="flex justify-end mb-2">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs">
                        <Check size={16} />
                        <span className="font-medium">저장되었습니다</span>
                    </div>
                </div>
            )}

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
                                    <option value="초1">초1</option>
                                    <option value="초2">초2</option>
                                    <option value="초3">초3</option>
                                    <option value="초4">초4</option>
                                    <option value="초5">초5</option>
                                    <option value="초6">초6</option>
                                    <option value="중1">중1</option>
                                    <option value="중2">중2</option>
                                    <option value="중3">중3</option>
                                    <option value="고1">고1</option>
                                    <option value="고2">고2</option>
                                    <option value="고3">고3</option>
                                    <option value="N수">N수</option>
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
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">학부모 관계</label>
                                <select
                                    value={formData.parentRelation}
                                    onChange={(e) => setFormData({ ...formData, parentRelation: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                >
                                    <option value="부">부</option>
                                    <option value="모">모</option>
                                    <option value="조부">조부</option>
                                    <option value="조모">조모</option>
                                    <option value="기타">기타</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">학부모 연락처</label>
                                <input
                                    type="tel"
                                    value={formData.parentPhone}
                                    onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                            <Phone size={20} className="text-indigo-600" />
                            학교 및 기타 정보
                        </h2>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">학교명</label>
                                <input
                                    type="text"
                                    value={formData.schoolName}
                                    onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">학교 유형</label>
                                <select
                                    value={formData.schoolType}
                                    onChange={(e) => setFormData({ ...formData, schoolType: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                >
                                    <option value="일반고">일반고</option>
                                    <option value="자사고">자사고</option>
                                    <option value="외국어고">외국어고</option>
                                    <option value="국제고">국제고</option>
                                    <option value="과학고">과학고</option>
                                    <option value="영재고">영재고</option>
                                    <option value="예술고">예술고</option>
                                    <option value="체육고">체육고</option>
                                    <option value="특성화고">특성화고</option>
                                    <option value="마이스터고">마이스터고</option>
                                    <option value="기타">기타</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">등록일</label>
                                <input
                                    type="date"
                                    value={formData.enrollmentDate || ""}
                                    onChange={(e) => setFormData({ ...formData, enrollmentDate: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">특이사항 메모</label>
                                <textarea
                                    value={formData.memo}
                                    onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent min-h-[80px] resize-none"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm p-6">
                        <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Key size={18} className="text-indigo-600" />
                            로그인 계정 (카카오)
                        </h2>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1.5">카카오 UID</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={student.kakaoUid || ""}
                                        readOnly
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono text-xs text-gray-700"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleCopy("kakaoUid", student.kakaoUid || "")}
                                        className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                    >
                                        {copiedField === "kakaoUid" ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                                    </button>
                                </div>
                                <p className="text-[11px] text-gray-500 mt-1">
                                    카카오 로그인 연동에 사용되는 고유 값입니다. 변경할 수 없습니다.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm p-6">
                        <h3 className="font-semibold text-gray-900 mb-4">계정 상태</h3>
                        {docIdForStatus ? (
                            <div className="space-y-3">
                                <p className="text-xs text-gray-500">
                                    로그인 차단(비활성화)를 사용하면 학생은 카카오로 로그인할 수 없으며,
                                    기존 학습 데이터는 그대로 유지됩니다.
                                </p>
                                <div className={`p-3 rounded-lg ${isLoginBlocked ? "bg-amber-50" : "bg-green-50"}`}>
                                    <p className={`text-sm font-medium ${isLoginBlocked ? "text-amber-900" : "text-green-900"}`}>
                                        {isLoginBlocked ? "로그인 차단됨" : "로그인 허용"}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const newStatus = isLoginBlocked ? "ACTIVE" : "INACTIVE";
                                        setVisualAccountStatus(newStatus);
                                        updateStudentAccountStatusAdmin(docIdForStatus, newStatus).then((res) => {
                                            if (res.success) {
                                                router.refresh();
                                            } else {
                                                setVisualAccountStatus(isLoginBlocked ? "INACTIVE" : "ACTIVE");
                                                alert(res.message ?? "변경 실패");
                                            }
                                        });
                                    }}
                                    className={`w-full py-2 rounded-lg text-sm font-medium min-h-[40px] ${isLoginBlocked ? "bg-green-600 hover:bg-green-700 text-white" : "bg-amber-600 hover:bg-amber-700 text-white"}`}
                                >
                                    {isLoginBlocked ? "로그인 허용으로 변경" : "로그인 차단(비활성화)"}
                                </button>
                            </div>
                        ) : (
                            <p className="text-xs text-gray-500">학생 문서 ID 정보를 찾을 수 없어 계정 상태 변경을 지원하지 않습니다.</p>
                        )}
                    </div>

                    {/* 연동된 학부모 */}
                    <div className="bg-white rounded-2xl shadow-sm p-6">
                        <h3 className="font-semibold text-gray-900 mb-3">연동된 학부모</h3>
                        {linkedParents.length > 0 ? (
                            <ul className="space-y-2 text-xs text-gray-700">
                                {linkedParents.map((p) => (
                                    <li key={p.uid} className="flex items-center justify-between border-b last:border-b-0 pb-2">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-gray-900">{p.name || "학부모"}</span>
                                            {p.phoneNumber && (
                                                <span className="text-[11px] text-gray-500">{p.phoneNumber}</span>
                                            )}
                                            <span className="text-[11px] text-gray-400">카카오 UID: {p.uid}</span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-xs text-gray-500">현재 이 학생과 연동된 학부모가 없습니다.</p>
                        )}
                    </div>

                    {/* 최근 로그인 로그 */}
                    <div className="bg-white rounded-2xl shadow-sm p-6">
                        <h3 className="font-semibold text-gray-900 mb-3">최근 로그인 기록</h3>
                        {Array.isArray((rawStudent as any).loginHistory) && (rawStudent as any).loginHistory.length > 0 ? (
                            <ul className="space-y-1 max-h-56 overflow-y-auto text-xs text-gray-700">
                                {[...(rawStudent as any).loginHistory]
                                    .slice()
                                    .reverse()
                                    .slice(0, 20)
                                    .map((iso: string, idx: number) => (
                                        <li key={`${iso}-${idx}`} className="flex items-center justify-between border-b last:border-b-0 py-1">
                                            <span>#{(rawStudent as any).loginHistory.length - idx}</span>
                                            <span className="font-mono text-[11px]">
                                                {new Date(iso).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}
                                            </span>
                                        </li>
                                    ))}
                            </ul>
                        ) : (
                            <p className="text-xs text-gray-500">아직 로그인 기록이 없습니다.</p>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={handleSave}
                        className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm"
                    >
                        <Save size={18} />
                        변경사항 저장
                    </button>

                    <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(true)}
                        className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
                    >
                        <Trash2 size={18} />
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
