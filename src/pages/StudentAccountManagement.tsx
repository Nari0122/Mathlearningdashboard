import { ArrowLeft, User, Mail, Phone, Key, Save, ShieldAlert, Check, Copy, Trash2, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { Student } from '../types';

interface StudentAccountManagementProps {
  student: Student;
  onBack: () => void;
  onSave: (updatedStudent: Student, newPassword?: string) => void;
  onDelete?: (studentId: number) => void;
}

export function StudentAccountManagement({ student, onBack, onSave, onDelete }: StudentAccountManagementProps) {
  const [formData, setFormData] = useState({
    name: student.name,
    grade: student.grade,
    class: student.class || '',
    email: student.email,
    phone: student.phone,
    loginId: student.loginId,
    isActive: student.isActive
  });

  const [newPassword, setNewPassword] = useState('');
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleCopy = (field: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const generatePassword = () => {
    const randomPassword = Math.random().toString(36).slice(-8) + Math.floor(Math.random() * 100);
    setNewPassword(randomPassword);
  };

  const handleSave = () => {
    const updatedStudent: Student = {
      ...student,
      ...formData,
      lastUpdated: new Date().toISOString().split('T')[0]
    };
    
    onSave(updatedStudent, newPassword);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(student.id);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
        >
          <ArrowLeft size={20} />
          <span>학생 목록으로 돌아가기</span>
        </button>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <span className="text-3xl font-bold text-white">{student.name[0]}</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">학생 계정 관리</h1>
              <p className="text-gray-600 mt-1">{student.name}님의 정보 및 계정을 관리합니다.</p>
            </div>
          </div>

          {/* Save Success Message */}
          {saveSuccess && (
            <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg">
              <Check size={20} />
              <span className="font-medium">저장되었습니다</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main Info Card */}
        <div className="col-span-2 space-y-6">
          {/* Basic Information */}
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  반/조
                </label>
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

          {/* Contact Information */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <Mail size={20} className="text-indigo-600" />
              연락처 정보
            </h2>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  이메일
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  전화번호
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Account Credentials */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <Key size={20} className="text-indigo-600" />
              로그인 계정
            </h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  로그인 ID
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.loginId}
                    onChange={(e) => setFormData({ ...formData, loginId: e.target.value })}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopy('loginId', formData.loginId)}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    {copiedField === 'loginId' ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">학생이 로그인할 때 사용하는 아이디입니다.</p>
              </div>

              {/* Password Reset Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="text-sm font-medium text-gray-700">
                    비밀번호 재설정
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPasswordReset(!showPasswordReset)}
                    className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    {showPasswordReset ? '취소' : '비밀번호 변경'}
                  </button>
                </div>

                {showPasswordReset && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start gap-2 mb-4">
                      <ShieldAlert size={20} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-yellow-800">
                        <p className="font-medium mb-1">비밀번호를 재설정하시겠습니까?</p>
                        <p className="text-xs">새로운 비밀번호를 생성하여 학생에게 전달해주세요.</p>
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
                          onClick={() => handleCopy('password', newPassword)}
                          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                          {copiedField === 'password' ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
                        </button>
                      )}
                    </div>

                    {newPassword && (
                      <p className="text-xs text-yellow-700">
                        생성된 비밀번호를 복사하여 학생에게 안전하게 전달하세요.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          {/* Account Status */}
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
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              <div className={`p-3 rounded-lg ${formData.isActive ? 'bg-green-50' : 'bg-red-50'}`}>
                <p className={`text-sm font-medium ${formData.isActive ? 'text-green-900' : 'text-red-900'}`}>
                  {formData.isActive ? '✓ 활성화됨' : '✕ 비활성화됨'}
                </p>
                <p className={`text-xs mt-1 ${formData.isActive ? 'text-green-700' : 'text-red-700'}`}>
                  {formData.isActive 
                    ? '학생이 로그인하여 시스템을 사용할 수 있습니다.' 
                    : '학생은 현재 로그인할 수 없습니다.'}
                </p>
              </div>
            </div>
          </div>

          {/* Progress Info */}
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
                <p className="text-sm font-medium text-gray-900">{student.lastUpdated}</p>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            <Save size={20} />
            변경사항 저장
          </button>

          {/* Delete Button */}
          {onDelete && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              <Trash2 size={20} />
              계정 삭제
            </button>
          )}

          {/* Delete Confirmation */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="bg-white rounded-lg p-6 text-center">
                <AlertTriangle size={40} className="text-red-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-4">계정 삭제 확인</h3>
                <p className="text-sm text-gray-600 mb-6">정말로 이 학생 계정을 삭제하시겠습니까?</p>
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    취소
                  </button>
                  <button
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