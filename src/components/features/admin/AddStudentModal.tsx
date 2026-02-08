"use client";

import { X, User, Mail, Key, Copy, Check } from "lucide-react";
import { useState } from "react";

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (student: {
    name: string;
    grade: string;
    class?: string;
    email: string;
    phone: string;
    loginId: string;
    tempPassword: string;
  }) => void;
}

export function AddStudentModal({ isOpen, onClose, onAdd }: AddStudentModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    grade: "",
    class: "",
    email: "",
    phone: "",
    loginId: "",
    tempPassword: "",
  });
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!isOpen) return null;

  const generateCredentials = () => {
    const randomId = `student${Math.floor(Math.random() * 10000)}`;
    const randomPassword = Math.random().toString(36).slice(-8);
    setFormData({
      ...formData,
      loginId: randomId,
      tempPassword: randomPassword,
    });
  };

  const handleCopy = (field: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.grade && formData.loginId && formData.tempPassword) {
      onAdd({
        name: formData.name,
        grade: formData.grade,
        class: formData.class || undefined,
        email: formData.email,
        phone: formData.phone,
        loginId: formData.loginId,
        tempPassword: formData.tempPassword,
      });
      handleClose();
    }
  };

  const handleClose = () => {
    setFormData({
      name: "",
      grade: "",
      class: "",
      email: "",
      phone: "",
      loginId: "",
      tempPassword: "",
    });
    setCopiedField(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-xl font-bold text-gray-900">새 학생 추가</h2>
          <button type="button" onClick={handleClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <User size={16} className="text-indigo-600" />
                기본 정보
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">이름 <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="예: 강나리"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">학년 <span className="text-red-500">*</span></label>
                  <select
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  >
                    <option value="">선택하세요</option>
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

            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Mail size={16} className="text-indigo-600" />
                연락처 정보
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">이메일</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="student@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">전화번호</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="010-1234-5678"
                  />
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Key size={16} className="text-indigo-600" />
                  로그인 계정
                </h3>
                <button
                  type="button"
                  onClick={generateCredentials}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  자동 생성
                </button>
              </div>
              <div className="bg-indigo-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-indigo-900 mb-2">
                  ⓘ 학생이 로그인할 때 사용할 아이디와 임시 비밀번호를 설정합니다.
                </p>
                <p className="text-xs text-indigo-700">학생에게 전달 후 첫 로그인 시 비밀번호 변경을 권장하세요.</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">로그인 ID <span className="text-red-500">*</span></label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.loginId}
                      onChange={(e) => setFormData({ ...formData, loginId: e.target.value })}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono"
                      placeholder="student001"
                      required
                    />
                    {formData.loginId && (
                      <button
                        type="button"
                        onClick={() => handleCopy("loginId", formData.loginId)}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        {copiedField === "loginId" ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">임시 비밀번호 <span className="text-red-500">*</span></label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.tempPassword}
                      onChange={(e) => setFormData({ ...formData, tempPassword: e.target.value })}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono"
                      placeholder="임시 비밀번호"
                      required
                    />
                    {formData.tempPassword && (
                      <button
                        type="button"
                        onClick={() => handleCopy("password", formData.tempPassword)}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        {copiedField === "password" ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              학생 추가
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
