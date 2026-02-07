import { Users, Plus, Search, Mail, Phone } from 'lucide-react';

interface Student {
  id: number;
  name: string;
  grade: string;
  email: string;
  phone: string;
  progress: number;
}

interface StudentManagementProps {
  onStudentSelect?: (studentId: number) => void;
}

export function StudentManagement({ onStudentSelect }: StudentManagementProps) {
  const students: Student[] = [
    { id: 1, name: '김민수', grade: '고1', email: 'minsu@example.com', phone: '010-1111-2222', progress: 85 },
    { id: 2, name: '이서연', grade: '고2', email: 'seoyeon@example.com', phone: '010-3333-4444', progress: 72 },
    { id: 3, name: '박지훈', grade: '고1', email: 'jihoon@example.com', phone: '010-5555-6666', progress: 90 },
    { id: 4, name: '최유진', grade: '고3', email: 'yujin@example.com', phone: '010-7777-8888', progress: 68 },
  ];

  return (
    <div className="max-w-[1440px] mx-auto p-8">
      {/* Page Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Users size={32} className="text-purple-600" />
            <h1 className="text-3xl font-bold text-gray-900">학생 관리</h1>
          </div>
          <p className="text-gray-600">등록된 학생 정보를 관리하고 학습 현황을 확인할 수 있습니다.</p>
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
          <Plus size={18} />
          <span className="font-medium">학생 추가</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl shadow-sm p-4 mb-6">
        <div className="relative">
          <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="학생 이름, 이메일로 검색..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Students Grid */}
      <div className="grid grid-cols-2 gap-6">
        {students.map((student) => (
          <div key={student.id} className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-2xl font-bold text-white">{student.name[0]}</span>
              </div>
              
              <div className="flex-1">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{student.name}</h3>
                    <p className="text-sm text-gray-500">{student.grade}</p>
                  </div>
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">
                    활동중
                  </span>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone size={14} />
                    <span>{student.phone}</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">학습 진도</span>
                    <span className="text-sm font-semibold text-gray-900">{student.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
                      style={{ width: `${student.progress}%` }}
                    />
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <button 
                    onClick={() => onStudentSelect && onStudentSelect(student.id)}
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                  >
                    상세보기
                  </button>
                  <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
                    수정
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {students.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
          <Users size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 mb-4">등록된 학생이 없습니다.</p>
          <button className="px-5 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
            첫 학생 추가하기
          </button>
        </div>
      )}
    </div>
  );
}