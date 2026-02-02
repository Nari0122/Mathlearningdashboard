import { useState } from 'react';
import { Calendar, Clock, Plus, Edit2, Trash2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface ClassSession {
  id: number;
  date: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'completed' | 'absent' | 'makeup' | 'cancelled';
  notes?: string;
}

interface RegularScheduleItem {
  id: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
}

interface ClassScheduleProps {
  isAdmin: boolean;
  sessions?: ClassSession[];
  regularSchedule?: RegularScheduleItem[];
  onAddSession?: (session: Omit<ClassSession, 'id'>) => void;
  onUpdateSession?: (id: number, session: Partial<ClassSession>) => void;
  onDeleteSession?: (id: number) => void;
  onUpdateRegularSchedule?: (schedule: RegularScheduleItem[] | undefined) => void;
}

export function ClassSchedule({
  isAdmin,
  sessions = [],
  regularSchedule = [],
  onAddSession,
  onUpdateSession,
  onDeleteSession,
  onUpdateRegularSchedule
}: ClassScheduleProps) {
  const [isAddingSession, setIsAddingSession] = useState(false);
  const [isAddingRegular, setIsAddingRegular] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<number | null>(null);

  const [newSession, setNewSession] = useState({
    date: '',
    dayOfWeek: '',
    startTime: '',
    endTime: '',
    status: 'scheduled' as const,
    notes: ''
  });

  const [newRegular, setNewRegular] = useState({
    dayOfWeek: '월요일',
    startTime: '16:00',
    endTime: '18:00'
  });

  const statusConfig = {
    scheduled: { label: '예정', color: 'bg-blue-100 text-blue-700', icon: Calendar },
    completed: { label: '완료', color: 'bg-green-100 text-green-700', icon: CheckCircle },
    absent: { label: '결석', color: 'bg-red-100 text-red-700', icon: XCircle },
    makeup: { label: '보강', color: 'bg-yellow-100 text-yellow-700', icon: AlertCircle },
    cancelled: { label: '취소', color: 'bg-gray-100 text-gray-700', icon: XCircle }
  };

  const handleAddSession = () => {
    if (!onAddSession) return;
    if (!newSession.date || !newSession.startTime || !newSession.endTime) return;

    onAddSession(newSession);
    setNewSession({
      date: '',
      dayOfWeek: '',
      startTime: '',
      endTime: '',
      status: 'scheduled',
      notes: ''
    });
    setIsAddingSession(false);
  };

  const handleAddRegular = () => {
    if (!onUpdateRegularSchedule) return;
    
    const newId = Math.max(...(regularSchedule || []).map(s => s.id), 0) + 1;
    const newSchedule = {
      id: newId,
      ...newRegular
    };
    
    onUpdateRegularSchedule([...(regularSchedule || []), newSchedule]);
    setNewRegular({ dayOfWeek: '월요일', startTime: '16:00', endTime: '18:00' });
    setIsAddingRegular(false);
  };

  const handleDeleteRegular = (id: number) => {
    if (!onUpdateRegularSchedule) return;
    onUpdateRegularSchedule((regularSchedule || []).filter(s => s.id !== id));
  };

  return (
    <div className="max-w-[1440px] mx-auto px-8 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">수업 일정 관리</h2>
        <p className="text-gray-600">정규 수업 시간과 수업 일정을 관리합니다.</p>
      </div>

      {/* 정규 수업 시간 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Clock size={24} className="text-blue-600" />
            <h3 className="text-lg font-bold text-gray-900">정규 수업 시간</h3>
          </div>
          {isAdmin && (
            <button
              onClick={() => setIsAddingRegular(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={18} />
              <span>수업 시간 추가</span>
            </button>
          )}
        </div>

        {/* 정규 수업 시간 목록 */}
        {regularSchedule && regularSchedule.length > 0 ? (
          <div className="space-y-3">
            {regularSchedule.map((schedule) => (
              <div key={schedule.id} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-4">
                  <Calendar size={20} className="text-blue-600" />
                  <div>
                    <p className="text-gray-900 font-medium">{schedule.dayOfWeek}</p>
                    <p className="text-sm text-gray-600">{schedule.startTime} - {schedule.endTime}</p>
                  </div>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => handleDeleteRegular(schedule.id)}
                    className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>설정된 정규 수업 시간이 없습니다.</p>
            {isAdmin && <p className="text-sm mt-2">수업 시간을 추가해주세요.</p>}
          </div>
        )}

        {/* 정규 수업 시간 추가 폼 */}
        {isAdmin && isAddingRegular && (
          <div className="mt-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-4">새 정규 수업 시간</h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">요일</label>
                <select
                  value={newRegular.dayOfWeek}
                  onChange={(e) => setNewRegular({ ...newRegular, dayOfWeek: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option>월요일</option>
                  <option>화요일</option>
                  <option>수요일</option>
                  <option>목요일</option>
                  <option>금요일</option>
                  <option>토요일</option>
                  <option>일요일</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">시작 시간</label>
                <input
                  type="time"
                  value={newRegular.startTime}
                  onChange={(e) => setNewRegular({ ...newRegular, startTime: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">종료 시간</label>
                <input
                  type="time"
                  value={newRegular.endTime}
                  onChange={(e) => setNewRegular({ ...newRegular, endTime: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleAddRegular}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                추가
              </button>
              <button
                onClick={() => setIsAddingRegular(false)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 수업 일정 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-900">수업 일정</h3>
          {isAdmin && (
            <button
              onClick={() => setIsAddingSession(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={18} />
              <span>일정 추가</span>
            </button>
          )}
        </div>

        {/* 수업 일정 목록 */}
        {sessions.length > 0 ? (
          <div className="space-y-3">
            {sessions.map((session) => {
              const StatusIcon = statusConfig[session.status].icon;
              
              return (
                <div key={session.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Calendar size={20} className="text-gray-600" />
                        <p className="font-medium text-gray-900">{session.date} ({session.dayOfWeek})</p>
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${statusConfig[session.status].color}`}>
                          <StatusIcon size={14} />
                          {statusConfig[session.status].label}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 ml-8">
                        <div className="flex items-center gap-2">
                          <Clock size={16} />
                          <span>{session.startTime} - {session.endTime}</span>
                        </div>
                        {session.notes && (
                          <p className="text-gray-500">• {session.notes}</p>
                        )}
                      </div>
                    </div>
                    {isAdmin && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => onUpdateSession?.(session.id, { status: session.status === 'completed' ? 'scheduled' : 'completed' })}
                          className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                        >
                          <CheckCircle size={18} />
                        </button>
                        <button
                          onClick={() => onDeleteSession?.(session.id)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p>등록된 수업 일정이 없습니다.</p>
            {isAdmin && <p className="text-sm mt-2">수업 일정을 추가해주세요.</p>}
          </div>
        )}

        {/* 수업 일정 추가 폼 */}
        {isAdmin && isAddingSession && (
          <div className="mt-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-4">새 수업 일정</h4>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">날짜</label>
                <input
                  type="date"
                  value={newSession.date}
                  onChange={(e) => setNewSession({ ...newSession, date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">요일</label>
                <input
                  type="text"
                  value={newSession.dayOfWeek}
                  onChange={(e) => setNewSession({ ...newSession, dayOfWeek: e.target.value })}
                  placeholder="예: 월요일"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">시작 시간</label>
                <input
                  type="time"
                  value={newSession.startTime}
                  onChange={(e) => setNewSession({ ...newSession, startTime: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">종료 시간</label>
                <input
                  type="time"
                  value={newSession.endTime}
                  onChange={(e) => setNewSession({ ...newSession, endTime: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">메모 (선택)</label>
              <textarea
                value={newSession.notes}
                onChange={(e) => setNewSession({ ...newSession, notes: e.target.value })}
                placeholder="예: 집합과 명제 복습"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={2}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleAddSession}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                추가
              </button>
              <button
                onClick={() => setIsAddingSession(false)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
