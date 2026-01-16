import { useState } from 'react';
import { FileText, Plus, Edit2, Trash2, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ExamRecord {
  id: number;
  examType: string;
  subject: string;
  date: string;
  score: number;
  maxScore?: number;
  notes?: string;
}

interface ExamRecordsProps {
  isAdmin: boolean;
  exams?: ExamRecord[];
  onAddExam?: (exam: Omit<ExamRecord, 'id'>) => void;
  onUpdateExam?: (id: number, exam: Partial<ExamRecord>) => void;
  onDeleteExam?: (id: number) => void;
}

export function ExamRecords({
  isAdmin,
  exams = [],
  onAddExam,
  onUpdateExam,
  onDeleteExam
}: ExamRecordsProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [newExam, setNewExam] = useState({
    examType: '',
    subject: '수학',
    date: new Date().toISOString().split('T')[0],
    score: 0,
    maxScore: 100,
    notes: ''
  });

  const [editForm, setEditForm] = useState<Partial<ExamRecord>>({});

  const handleAdd = () => {
    if (!onAddExam) return;
    if (!newExam.examType || !newExam.date) return;

    onAddExam(newExam);
    setNewExam({
      examType: '',
      subject: '수학',
      date: new Date().toISOString().split('T')[0],
      score: 0,
      maxScore: 100,
      notes: ''
    });
    setIsAdding(false);
  };

  const handleEdit = (exam: ExamRecord) => {
    setEditingId(exam.id);
    setEditForm(exam);
  };

  const handleSaveEdit = () => {
    if (!onUpdateExam || editingId === null) return;
    onUpdateExam(editingId, editForm);
    setEditingId(null);
    setEditForm({});
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const sortedExams = [...exams].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const getScoreColor = (score: number, maxScore: number = 100) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 70) return 'text-blue-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTrendIcon = (currentScore: number, previousScore?: number) => {
    if (!previousScore) return null;
    if (currentScore > previousScore) return <TrendingUp size={20} className="text-green-600" />;
    if (currentScore < previousScore) return <TrendingDown size={20} className="text-red-600" />;
    return <Minus size={20} className="text-gray-400" />;
  };

  const calculateAverage = () => {
    if (exams.length === 0) return 0;
    const total = exams.reduce((sum, exam) => {
      const percentage = ((exam.score / (exam.maxScore || 100)) * 100);
      return sum + percentage;
    }, 0);
    return (total / exams.length).toFixed(1);
  };

  return (
    <div className="max-w-[1440px] mx-auto px-8 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">시험 기록</h2>
        <p className="text-gray-600">시험 성적과 평가 기록을 관리합니다.</p>
      </div>

      {/* 평균 점수 */}
      {exams.length > 0 && (
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-sm p-6 mb-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 mb-1">평균 점수</p>
              <p className="text-4xl font-bold">{calculateAverage()}점</p>
            </div>
            <div className="text-right">
              <p className="text-blue-100 mb-1">총 시험 횟수</p>
              <p className="text-2xl font-bold">{exams.length}회</p>
            </div>
          </div>
        </div>
      )}

      {isAdmin && (
        <div className="mb-6">
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Plus size={20} />
            시험 기록 추가
          </button>
        </div>
      )}

      {/* 시험 추가 폼 */}
      {isAdding && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="font-bold text-gray-900 mb-4">새 시험 기록 추가</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">시험 종류</label>
                <input
                  type="text"
                  value={newExam.examType}
                  onChange={(e) => setNewExam({ ...newExam, examType: e.target.value })}
                  placeholder="예: 중간고사, 기말고사, 모의고사"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">과목</label>
                <input
                  type="text"
                  value={newExam.subject}
                  onChange={(e) => setNewExam({ ...newExam, subject: e.target.value })}
                  placeholder="과목명"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">시험 날짜</label>
                <input
                  type="date"
                  value={newExam.date}
                  onChange={(e) => setNewExam({ ...newExam, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">점수</label>
                <input
                  type="number"
                  value={newExam.score}
                  onChange={(e) => setNewExam({ ...newExam, score: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">만점</label>
                <input
                  type="number"
                  value={newExam.maxScore}
                  onChange={(e) => setNewExam({ ...newExam, maxScore: parseInt(e.target.value) || 100 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">메모</label>
              <textarea
                value={newExam.notes}
                onChange={(e) => setNewExam({ ...newExam, notes: e.target.value })}
                placeholder="시험에 대한 메모나 특이사항을 입력하세요"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
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

      {/* 시험 기록 목록 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {sortedExams.length === 0 ? (
          <div className="text-center py-12">
            <FileText size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">아직 시험 기록이 없습니다.</p>
            {isAdmin && (
              <p className="text-gray-400 text-sm mt-2">"시험 기록 추가" 버튼을 눌러 기록을 추가하세요.</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {sortedExams.map((exam, index) => {
              const isEditing = editingId === exam.id;
              const previousExam = sortedExams[index + 1];
              const percentage = ((exam.score / (exam.maxScore || 100)) * 100).toFixed(1);

              if (isEditing) {
                return (
                  <div key={exam.id} className="p-4 border-2 border-blue-500 rounded-lg bg-blue-50">
                    <h4 className="font-bold text-gray-900 mb-4">시험 기록 수정</h4>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">시험 종류</label>
                          <input
                            type="text"
                            value={editForm.examType || ''}
                            onChange={(e) => setEditForm({ ...editForm, examType: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">과목</label>
                          <input
                            type="text"
                            value={editForm.subject || ''}
                            onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">시험 날짜</label>
                          <input
                            type="date"
                            value={editForm.date || ''}
                            onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">점수</label>
                          <input
                            type="number"
                            value={editForm.score || 0}
                            onChange={(e) => setEditForm({ ...editForm, score: parseInt(e.target.value) || 0 })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">만점</label>
                          <input
                            type="number"
                            value={editForm.maxScore || 100}
                            onChange={(e) => setEditForm({ ...editForm, maxScore: parseInt(e.target.value) || 100 })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">메모</label>
                        <textarea
                          value={editForm.notes || ''}
                          onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
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
                <div key={exam.id} className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-gray-900">{exam.examType}</h3>
                        <span className="text-gray-600">({exam.subject})</span>
                        {getTrendIcon(exam.score, previousExam?.score)}
                      </div>
                      <div className="flex items-baseline gap-3 mb-3">
                        <span className={`text-3xl font-bold ${getScoreColor(exam.score, exam.maxScore)}`}>
                          {exam.score}점
                        </span>
                        <span className="text-gray-500">/ {exam.maxScore || 100}점</span>
                        <span className="text-lg font-medium text-gray-600">({percentage}%)</span>
                      </div>
                      <div className="text-sm text-gray-500 mb-2">
                        시험일: {exam.date}
                      </div>
                      {exam.notes && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-700">{exam.notes}</p>
                        </div>
                      )}
                    </div>
                    {isAdmin && (
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleEdit(exam)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="수정"
                        >
                          <Edit2 size={18} className="text-gray-600" />
                        </button>
                        <button
                          onClick={() => onDeleteExam?.(exam.id)}
                          className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                          title="삭제"
                        >
                          <Trash2 size={18} className="text-red-600" />
                        </button>
                      </div>
                    )}
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
