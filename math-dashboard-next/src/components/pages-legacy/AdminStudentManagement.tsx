import { Users, Plus, Search, MoreVertical, Trash2, Settings, Filter, TrendingUp, Clock, Mail, Phone } from 'lucide-react';
import { useState } from 'react';
import { Student } from '../../types';
import { AddStudentModal } from '../AddStudentModal';

interface AdminStudentManagementProps {
  students: Student[];
  onStudentSelect?: (studentId: number) => void;
  onStudentManage?: (studentId: number) => void;
  onAddStudent: (student: Omit<Student, 'id' | 'progress' | 'statusSummary' | 'lastUpdated' | 'isActive'> & { tempPassword: string }) => void;
  onDeleteStudent?: (studentId: number) => void;
}

export function AdminStudentManagement({ students, onStudentSelect, onStudentManage, onAddStudent, onDeleteStudent }: AdminStudentManagementProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // 필터링된 학생 목록
  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.loginId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGrade = gradeFilter === 'all' || student.grade === gradeFilter;
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && student.isActive) ||
      (statusFilter === 'inactive' && !student.isActive);
    return matchesSearch && matchesGrade && matchesStatus;
  });

  const handleAddStudent = (studentData: Omit<Student, 'id' | 'progress' | 'statusSummary' | 'lastUpdated' | 'isActive'> & { tempPassword: string }) => {
    onAddStudent(studentData);
    setIsAddModalOpen(false);
  };

  // 통계 계산
  const totalStudents = students.filter(s => s.isActive).length;
  const avgProgress = students.filter(s => s.isActive).length > 0
    ? Math.round(students.filter(s => s.isActive).reduce((sum, s) => sum + s.progress, 0) / students.filter(s => s.isActive).length)
    : 0;

  return (
    <div className="max-w-[1440px] mx-auto p-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Users size={32} className="text-purple-600" />
              <h1 className="text-3xl font-bold text-gray-900">학생 관리</h1>
            </div>
            <p className="text-gray-600">등록된 학생을 관리하고 학습 현황을 모니터링할 수 있습니다.</p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
          >
            <Plus size={18} />
            <span className="font-medium">학생 추가</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-sm p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <p className="text-blue-100">전체 학생</p>
            <Users size={24} className="text-blue-200" />
          </div>
          <p className="text-4xl font-bold">{totalStudents}</p>
          <p className="text-sm text-blue-100 mt-1">명</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-sm p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <p className="text-green-100">평균 진도</p>
            <TrendingUp size={24} className="text-green-200" />
          </div>
          <p className="text-4xl font-bold">{avgProgress}%</p>
          <p className="text-sm text-green-100 mt-1">전체 학생 평균</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-sm p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <p className="text-purple-100">활성 학생</p>
            <Clock size={24} className="text-purple-200" />
          </div>
          <p className="text-4xl font-bold">{totalStudents}</p>
          <p className="text-sm text-purple-100 mt-1">최근 활동 기준</p>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-2xl shadow-sm p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="학생 이름, 아이디로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-400" />
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">전체 학년</option>
              <option value="중1">중1</option>
              <option value="중2">중2</option>
              <option value="중3">중3</option>
              <option value="고1">고1</option>
              <option value="고2">고2</option>
              <option value="고3">고3</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">전체 상태</option>
              <option value="active">활성화</option>
              <option value="inactive">비활성화</option>
            </select>
          </div>
        </div>
      </div>

      {/* Students Grid */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {searchQuery || gradeFilter !== 'all' || statusFilter !== 'all' ? `검색 결과 (${filteredStudents.length})` : `전체 학생 (${totalStudents})`}
          </h2>
        </div>

        {filteredStudents.length > 0 ? (
          <div className="grid grid-cols-2 gap-6">
            {filteredStudents.map((student) => (
              <div
                key={student.id}
                className={`bg-white border rounded-xl p-6 hover:shadow-md transition-shadow ${student.isActive ? 'border-gray-200' : 'border-gray-300 bg-gray-50'
                  }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 ${student.isActive
                    ? 'bg-gradient-to-br from-purple-500 to-pink-500'
                    : 'bg-gradient-to-br from-gray-400 to-gray-500'
                    }`}>
                    <span className="text-2xl font-bold text-white">{student.name[0]}</span>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className={`text-lg font-semibold ${student.isActive ? 'text-gray-900' : 'text-gray-600'}`}>
                          {student.name}
                        </h3>
                        <p className="text-sm text-gray-500">{student.grade} {student.class && `· ${student.class}`}</p>
                      </div>
                      <span className={`px-3 py-1 text-xs rounded-full font-medium ${student.isActive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-200 text-gray-600'
                        }`}>
                        {student.isActive ? '활동중' : '비활성화'}
                      </span>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="font-medium text-gray-700">ID:</span>
                        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{student.loginId}</span>
                      </div>
                      {student.phone && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone size={14} />
                          <span>{student.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock size={14} />
                        <span>최근 업데이트: {student.lastUpdated}</span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">학습 진도</span>
                        <span className="text-sm font-semibold text-gray-900">{student.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${student.isActive
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                            : 'bg-gray-400'
                            }`}
                          style={{ width: `${student.progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => onStudentSelect && onStudentSelect(student.id)}
                        className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!student.isActive}
                      >
                        관리
                      </button>
                      <button
                        onClick={() => onStudentManage && onStudentManage(student.id)}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        수정
                      </button>
                      {onDeleteStudent && (
                        <button
                          onClick={() => setDeleteConfirmId(student.id)}
                          className={`flex-1 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${student.isActive
                            ? 'bg-red-600 text-white hover:bg-red-700'
                            : 'bg-gray-400 text-white hover:bg-gray-500'
                            }`}
                        >
                          {student.isActive ? '비활성화' : '활성화'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Users size={48} className="mx-auto text-gray-300 mb-4" />
            {searchQuery || gradeFilter !== 'all' || statusFilter !== 'all' ? (
              <>
                <p className="text-gray-500 mb-2">검색 결과가 없습니다.</p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setGradeFilter('all');
                    setStatusFilter('all');
                  }}
                  className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                >
                  전체 목록 보기
                </button>
              </>
            ) : (
              <>
                <p className="text-gray-500 mb-4">등록된 학생이 없습니다.</p>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-5 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  첫 학생 추가하기
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <AddStudentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddStudent}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirmId !== null && (() => {
        const targetStudent = students.find(s => s.id === deleteConfirmId);
        const isActive = targetStudent?.isActive ?? true;

        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
              <div className="text-center mb-6">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${isActive ? 'bg-red-100' : 'bg-green-100'
                  }`}>
                  <Users size={24} className={isActive ? 'text-red-600' : 'text-green-600'} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {isActive ? '학생 비활성화' : '학생 활성화'}
                </h3>
                <p className="text-gray-600">
                  {targetStudent?.name}님을 {isActive ? '비활성화' : '활성화'}하시겠습니까?
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  {isActive
                    ? '비활성화된 학생은 로그인할 수 없으며, 관리 기능이 제한됩니다.'
                    : '활성화하면 학생이 다시 로그인하고 학습할 수 있습니다.'}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={() => {
                    if (onDeleteStudent) {
                      onDeleteStudent(deleteConfirmId);
                    }
                    setDeleteConfirmId(null);
                  }}
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors ${isActive
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                >
                  {isActive ? '비활성화' : '활성화'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}