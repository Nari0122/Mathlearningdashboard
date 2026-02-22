import { BookOpen, Clock, Calendar, CheckCircle, Plus, Edit2, Trash2, X } from 'lucide-react';
import { useState } from 'react';

interface LearningRecord {
  id: number;
  date: string;
  progress: string;
  comment: string;
  createdBy: 'admin' | 'student';
}

interface LearningHistoryProps {
  isAdmin?: boolean;
  records: LearningRecord[];
  onAdd?: (record: { date: string; progress: string; comment: string }) => void;
  onUpdate?: (id: number, record: { date: string; progress: string; comment: string }) => void;
  onDelete?: (id: number) => void;
}

export function LearningHistory({ 
  isAdmin = false,
  records,
  onAdd,
  onUpdate,
  onDelete
}: LearningHistoryProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<LearningRecord | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    progress: '',
    comment: ''
  });

  const handleOpenModal = (record?: LearningRecord) => {
    if (record) {
      setEditingRecord(record);
      setFormData({
        date: record.date,
        progress: record.progress,
        comment: record.comment
      });
    } else {
      setEditingRecord(null);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        progress: '',
        comment: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRecord(null);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      progress: '',
      comment: ''
    });
  };

  const handleSave = () => {
    if (!formData.progress || !formData.comment) {
      alert('나간 진도와 코멘트를 입력해주세요.');
      return;
    }

    if (editingRecord && onUpdate) {
      onUpdate(editingRecord.id, formData);
    } else if (onAdd) {
      onAdd(formData);
    }

    handleCloseModal();
  };

  const handleDelete = (id: number) => {
    if (onDelete) {
      onDelete(id);
    }
    setDeleteConfirmId(null);
  };

  return (
    <div className="max-w-[1440px] mx-auto p-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <BookOpen size={32} className="text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">학습 기록</h1>
            </div>
            <p className="text-gray-600">
              {isAdmin 
                ? '학생의 학습 내용과 진도를 일기장처럼 기록하고 관리할 수 있습니다.' 
                : '선생님이 작성한 학습 기록을 확인할 수 있습니다.'}
            </p>
          </div>
          
          {/* Add Button (Admin Only) */}
          {isAdmin && onAdd && (
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus size={20} />
              <span>기록 추가</span>
            </button>
          )}
        </div>
      </div>

      {/* Learning Records Timeline */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">학습 일지</h3>
        
        <div className="space-y-6">
          {records.map((item) => (
            <div key={item.id} className="border border-gray-200 rounded-xl p-5 hover:border-indigo-300 transition-colors">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Calendar size={24} className="text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-lg">{item.date}</h4>
                    <p className="text-sm text-gray-500">
                      {item.createdBy === 'admin' ? '관리자 작성' : '학생 작성'}
                    </p>
                  </div>
                </div>
                
                {/* Edit/Delete Buttons (Admin Only) */}
                {isAdmin && onUpdate && onDelete && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenModal(item)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="수정"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(item.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="삭제"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                )}
              </div>
              
              {/* Content */}
              <div className="ml-15 space-y-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle size={16} className="text-green-600" />
                    <span className="text-sm font-medium text-gray-500">나간 진도</span>
                  </div>
                  <p className="text-gray-900 pl-6">{item.progress}</p>
                </div>
                
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <BookOpen size={16} className="text-purple-600" />
                    <span className="text-sm font-medium text-gray-500">코멘트</span>
                  </div>
                  <p className="text-gray-700 pl-6 whitespace-pre-wrap">{item.comment}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {records.length === 0 && (
          <div className="text-center py-16">
            <BookOpen size={56} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">학습 기록이 없습니다</h3>
            <p className="text-gray-500">
              {isAdmin 
                ? '학생의 학습 내용을 기록해보세요.' 
                : '선생님이 작성한 기록이 여기에 표시됩니다.'}
            </p>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && isAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                {editingRecord ? '학습 기록 수정' : '학습 기록 추가'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  날짜 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  나간 진도 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.progress}
                  onChange={(e) => setFormData({ ...formData, progress: e.target.value })}
                  placeholder="예: 집합과 명제 3-2단원 완료, 함수 1-1단원 학습 등"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">어떤 단원을 어디까지 학습했는지 간단히 적어주세요.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  코멘트 (선생님 피드백/숙제/주의점) <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.comment}
                  onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                  placeholder="예: 개념 이해도 우수. 다음 시간 문제 풀이 예정.&#10;숙제: 연습문제 5개"
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">학생의 이해도, 숙제, 다음 수업 계획 등을 자유롭게 작성해주세요.</p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCloseModal}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                {editingRecord ? '수정' : '추가'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId !== null && isAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={24} className="text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">기록 삭제</h3>
              <p className="text-gray-600">이 학습 기록을 삭제하시겠습니까?</p>
              <p className="text-sm text-red-600 mt-2">이 작업은 되돌릴 수 없습니다.</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
