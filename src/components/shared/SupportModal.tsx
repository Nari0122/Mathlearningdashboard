"use client";

import { X, User, Save, Lock, Check, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SupportModal({ isOpen, onClose }: SupportModalProps) {
  const { data: session } = useSession();
  const [editInfo, setEditInfo] = useState({ name: "", email: "", phone: "" });
  const [passwordInfo, setPasswordInfo] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (session?.user) {
      const u = session.user as { name?: string; email?: string };
      setEditInfo({
        name: u.name ?? "",
        email: typeof u.email === "string" ? u.email : "",
        phone: "",
      });
    }
  }, [session?.user]);

  if (!isOpen || !session?.user) return null;

  const user = session.user as { name?: string; email?: string; id?: string };
  const loginId = (session.user as { username?: string }).username ?? (user.email ?? "");

  const handleSave = () => {
    setErrorMessage("");
    if (showPasswordChange) {
      if (!passwordInfo.currentPassword) {
        setErrorMessage("현재 비밀번호를 입력해주세요.");
        return;
      }
      if (!passwordInfo.newPassword) {
        setErrorMessage("새 비밀번호를 입력해주세요.");
        return;
      }
      if (passwordInfo.newPassword !== passwordInfo.confirmPassword) {
        setErrorMessage("새 비밀번호가 일치하지 않습니다.");
        return;
      }
      if (passwordInfo.newPassword.length < 6) {
        setErrorMessage("비밀번호는 최소 6자 이상이어야 합니다.");
        return;
      }
      // TODO: API로 비밀번호 변경 시 연동
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setPasswordInfo({ currentPassword: "", newPassword: "", confirmPassword: "" });
        setShowPasswordChange(false);
        onClose();
      }, 2000);
    } else {
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        onClose();
      }, 2000);
    }
  };

  const handleCancel = () => {
    setEditInfo({
      name: user.name ?? "",
      email: typeof user.email === "string" ? user.email : "",
      phone: "",
    });
    setPasswordInfo({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setShowPasswordChange(false);
    setErrorMessage("");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900">계정 설정</h2>
            <p className="text-sm text-gray-500 mt-1">Account Settings</p>
          </div>
          <button type="button" onClick={handleCancel} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {showSuccess && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
              <Check size={20} className="text-green-600" />
              <span className="text-green-800 font-medium">
                {showPasswordChange ? "비밀번호가 성공적으로 변경되었습니다." : "계정 정보가 저장되었습니다."}
              </span>
            </div>
          )}

          {errorMessage && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle size={20} className="text-red-600" />
              <span className="text-red-800 text-sm">{errorMessage}</span>
            </div>
          )}

          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 bg-gray-900 rounded-full flex items-center justify-center">
              <User size={48} className="text-white" />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">이름</label>
              <input
                type="text"
                value={editInfo.name}
                onChange={(e) => setEditInfo({ ...editInfo, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">로그인 ID</label>
              <div className="px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">
                <span className="text-gray-900 font-mono">{loginId}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">로그인 ID는 변경할 수 없습니다.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">이메일</label>
              <input
                type="email"
                value={editInfo.email}
                onChange={(e) => setEditInfo({ ...editInfo, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="teacher@mathclinic.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">연락처</label>
              <input
                type="tel"
                value={editInfo.phone}
                onChange={(e) => setEditInfo({ ...editInfo, phone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="010-1234-5678"
              />
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  setShowPasswordChange(!showPasswordChange);
                  setErrorMessage("");
                }}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
              >
                <div className="flex items-center gap-2">
                  <Lock size={18} className="text-gray-600" />
                  <span className="text-gray-900 font-medium">비밀번호 변경</span>
                </div>
                <span className="text-gray-400">{showPasswordChange ? "▲" : "▼"}</span>
              </button>
            </div>

            {showPasswordChange && (
              <div className="space-y-4 mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-start gap-2 mb-2">
                  <AlertCircle size={18} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-yellow-800">
                    비밀번호를 변경하시겠습니까? 변경 후에는 새 비밀번호로 로그인해야 합니다.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">현재 비밀번호</label>
                  <input
                    type="password"
                    value={passwordInfo.currentPassword}
                    onChange={(e) => setPasswordInfo({ ...passwordInfo, currentPassword: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-white"
                    placeholder="현재 비밀번호 입력"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">새 비밀번호</label>
                  <input
                    type="password"
                    value={passwordInfo.newPassword}
                    onChange={(e) => setPasswordInfo({ ...passwordInfo, newPassword: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-white"
                    placeholder="새 비밀번호 입력 (최소 6자)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">새 비밀번호 확인</label>
                  <input
                    type="password"
                    value={passwordInfo.confirmPassword}
                    onChange={(e) => setPasswordInfo({ ...passwordInfo, confirmPassword: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-white"
                    placeholder="새 비밀번호 재입력"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
            >
              <Save size={18} />
              저장
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              취소
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
