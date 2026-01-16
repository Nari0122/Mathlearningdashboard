import { useState } from 'react';
import { BookOpen, Plus, Edit2, Trash2, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

interface HomeworkItem {
  id: number;
  title: string;
  description: string;
  assignedDate: string;
  dueDate: string;
  status: 'pending' | 'submitted' | 'overdue';
  feedback?: string;
}

interface HomeworkProps {
  isAdmin: boolean;
  homework?: HomeworkItem[];
  onAddHomework?: (homework: Omit<HomeworkItem, 'id'>) => void;
  onUpdateHomework?: (id: number, homework: Partial<HomeworkItem>) => void;
  onDeleteHomework?: (id: number) => void;
}

export function Homework({
  isAdmin,
  homework = [],
  onAddHomework,
  onUpdateHomework,
  onDeleteHomework
}: HomeworkProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [newHomework, setNewHomework] = useState({
    title: '',
    description: '',
    assignedDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    status: 'pending' as const,
    feedback: ''
  });

  const [editForm, setEditForm] = useState<Partial<HomeworkItem>>({});

  const statusConfig = {
    pending: { label: '진행중', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
    submitted: { label: '제출완료', color: 'bg-green-100 text-green-700', icon: CheckCircle },
    overdue: { label: '기한초과', color: 'bg-red-100 text-red-700', icon: AlertTriangle }
  };

  // 마감일이 지나면 자동으로 overdue로 변경
  const getActualStatus = (hw: HomeworkItem): 'pending' | 'submitted' | 'overdue' => {
    const today = new Date().toISOString().split('T')[0];
    if (hw.status === 'submitted') {
      return 'submitted';
    }
    if (hw.dueDate < today) {
      return 'overdue';
    }
    return hw.status;
  };

  const handleAdd = () => {
    if (!onAddHomework) return;
    if (!newHomework.title || !newHomework.dueDate) return;

    onAddHomework(newHomework);
    setNewHomework({
      title: '',
      description: '',
      assignedDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      status: 'pending',
      feedback: ''
    });
    setIsAdding(false);
  };

  const handleEdit = (hw: HomeworkItem) => {
    setEditingId(hw.id);
    setEditForm(hw);
  };

  const handleSaveEdit = () => {
    if (!onUpdateHomework || editingId === null) return;
    onUpdateHomework(editingId, editForm);
    setEditingId(null);
    setEditForm({});
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const sortedHomework = [...homework].sort((a, b) => 
    new Date(b.assignedDate).getTime() - new Date(a.assignedDate).getTime()
  );

  return (
    <div className="max-w-[1440px] mx-auto px-8 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">숙제 관리</h2>
        <p className="text-gray-600">학습 과제와 숙제를 관리합니다.</p>
      </div>

      {isAdmin && (
        <div className="mb-6">
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Plus size={20} />
            숙제 추가
          </button>
        </div>
      )}

      {/* 숙제 추가 폼 */}
      {isAdding && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="font-bold text-gray-900 mb-4">새 숙제 추가</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">제목</label>
              <input
                type="text"
                value={newHomework.title}
                onChange={(e) => setNewHomework({ ...newHomework, title: e.target.value })}
                placeholder="예: 수학 문제집 p.24-28"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">설명</label>
              <textarea
                value={newHomework.description}
                onChange={(e) => setNewHomework({ ...newHomework, description: e.target.value })}
                placeholder="과제 내용을 자세히 입력하세요"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">부여일</label>
                <input
                  type="date"
                  value={newHomework.assignedDate}
                  onChange={(e) => setNewHomework({ ...newHomework, assignedDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">마감일</label>
                <input
                  type="date"
                  value={newHomework.dueDate}
                  onChange={(e) => setNewHomework({ ...newHomework, dueDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAdd}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                추가
              </button>
              <button
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 숙제 목록 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {sortedHomework.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">아직 숙제가 없습니다.</p>
            {isAdmin && (
              <p className="text-gray-400 text-sm mt-2">"숙제 추가" 버튼을 눌러 과제를 추가하세요.</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {sortedHomework.map((hw) => {
              const actualStatus = getActualStatus(hw);
              const config = statusConfig[actualStatus];
              const StatusIcon = config.icon;
              const isEditing = editingId === hw.id;

              if (isEditing) {
                return (
                  <div key={hw.id} className="p-4 border-2 border-blue-500 rounded-lg bg-blue-50">
                    <h4 className="font-bold text-gray-900 mb-4">숙제 수정</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">제목</label>
                        <input
                          type="text"
                          value={editForm.title || ''}
                          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">설명</label>
                        <textarea
                          value={editForm.description || ''}
                          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">마감일</label>
                          <input
                            type="date"
                            value={editForm.dueDate || ''}
                            onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">상태</label>
                          <select
                            value={editForm.status || 'pending'}
                            onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="pending">진행중</option>
                            <option value="submitted">제출완료</option>
                            <option value="overdue">기한초과</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">피드백</label>
                          <input
                            type="text"
                            value={editForm.feedback || ''}
                            onChange={(e) => setEditForm({ ...editForm, feedback: e.target.value })}
                            placeholder="피드백 입력"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveEdit}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        >
                          저장
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div key={hw.id} className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-gray-900">{hw.title}</h3>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-sm font-medium ${config.color}`}>
                          <StatusIcon size={14} />
                          {config.label}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-3">{hw.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>부여일: {hw.assignedDate}</span>
                        <span>마감일: {hw.dueDate}</span>
                      </div>
                      {hw.feedback && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-900"><strong>피드백:</strong> {hw.feedback}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      {/* 학생용 완료 체크 버튼 */}
                      {!isAdmin && actualStatus === 'pending' && (
                        <button
                          onClick={() => onUpdateHomework?.(hw.id, { status: 'submitted' })}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
                          title="완료 표시"
                        >
                          <CheckCircle size={18} />
                          <span>완료</span>
                        </button>
                      )}
                      {/* 관리자 버튼들 */}
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => handleEdit(hw)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="수정"
                          >
                            <Edit2 size={18} className="text-gray-600" />
                          </button>
                          <button
                            onClick={() => onDeleteHomework?.(hw.id)}
                            className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                            title="삭제"
                          >
                            <Trash2 size={18} className="text-red-600" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}