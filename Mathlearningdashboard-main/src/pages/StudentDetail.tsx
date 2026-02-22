import { ArrowLeft, User, Mail, Phone } from 'lucide-react';
import { TabNavigation } from '../components/TabNavigation';
import { Dashboard } from './Dashboard';
import { UnitManagement } from './UnitManagement';
import { ErrorAnalysis } from './ErrorAnalysis';
import { StatsReport } from './StatsReport';
import { LearningHistory } from './LearningHistory';
import { ClassSchedule } from './ClassSchedule';
import { Homework } from './Homework';
import { ExamRecords } from './ExamRecords';

interface Student {
  id: number;
  name: string;
  grade: string;
  email: string;
  phone: string;
  progress: number;
}

interface StudentDetailProps {
  student: Student;
  currentSubPage: string;
  onNavigate: (page: string) => void;
  onBack: () => void;
  units: Array<{
    id: number;
    name: string;
    status: 'HIGH' | 'MID' | 'LOW';
    errors: {
      C: number;
      M: number;
      R: number;
      S: number;
    };
    selectedDifficulty: string;
    completionStatus?: 'incomplete' | 'in-progress' | 'completed';
  }>;
  onDifficultyChange: (unitId: number, difficulty: string) => void;
  onNameChange: (unitId: number, newName: string) => void;
  onDelete: (unitId: number) => void;
  onErrorChange: (unitId: number, errorType: 'C' | 'M' | 'R' | 'S', delta: number) => void;
  onAddUnit: () => void;
  learningRecords?: Array<{
    id: number;
    date: string;
    progress: string;
    comment: string;
    createdBy: 'admin' | 'student';
  }>;
  onAddLearningRecord?: (record: { date: string; progress: string; comment: string }) => void;
  onUpdateLearningRecord?: (id: number, record: { date: string; progress: string; comment: string }) => void;
  onDeleteLearningRecord?: (id: number) => void;
  onCompletionStatusChange?: (unitId: number, status: 'incomplete' | 'in-progress' | 'completed') => void;
  onStatusChange?: (unitId: number, status: 'HIGH' | 'MID' | 'LOW') => void;
  
  // 수업 일정 관련
  classSessions?: Array<{
    id: number;
    date: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    status: 'scheduled' | 'completed' | 'absent' | 'makeup' | 'cancelled';
    notes?: string;
  }>;
  regularSchedule?: Array<{
    id: number;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
  }>;
  onAddClassSession?: (session: {
    date: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    status: 'scheduled' | 'completed' | 'absent' | 'makeup' | 'cancelled';
    notes?: string;
  }) => void;
  onUpdateClassSession?: (id: number, session: {
    date?: string;
    dayOfWeek?: string;
    startTime?: string;
    endTime?: string;
    status?: 'scheduled' | 'completed' | 'absent' | 'makeup' | 'cancelled';
    notes?: string;
  }) => void;
  onDeleteClassSession?: (id: number) => void;
  onUpdateRegularSchedule?: (schedule: Array<{ id: number; dayOfWeek: string; startTime: string; endTime: string }> | undefined) => void;
  
  // 숙제 관련
  homework?: Array<{
    id: number;
    title: string;
    description: string;
    assignedDate: string;
    dueDate: string;
    status: 'pending' | 'submitted' | 'overdue';
    feedback?: string;
  }>;
  onAddHomework?: (homework: {
    title: string;
    description: string;
    assignedDate: string;
    dueDate: string;
    status: 'pending' | 'submitted' | 'overdue';
    feedback?: string;
  }) => void;
  onUpdateHomework?: (id: number, homework: {
    title?: string;
    description?: string;
    assignedDate?: string;
    dueDate?: string;
    status?: 'pending' | 'submitted' | 'overdue';
    feedback?: string;
  }) => void;
  onDeleteHomework?: (id: number) => void;
  
  // 시험 기록 관련
  examRecords?: Array<{
    id: number;
    examType: string;
    subject: string;
    date: string;
    score: number;
    maxScore?: number;
    notes?: string;
  }>;
  onAddExam?: (exam: {
    examType: string;
    subject: string;
    date: string;
    score: number;
    maxScore?: number;
    notes?: string;
  }) => void;
  onUpdateExam?: (id: number, exam: {
    examType?: string;
    subject?: string;
    date?: string;
    score?: number;
    maxScore?: number;
    notes?: string;
  }) => void;
  onDeleteExam?: (id: number) => void;
}

export function StudentDetail({
  student,
  currentSubPage,
  onNavigate,
  onBack,
  units,
  onDifficultyChange,
  onNameChange,
  onDelete,
  onErrorChange,
  onAddUnit,
  learningRecords = [],
  onAddLearningRecord,
  onUpdateLearningRecord,
  onDeleteLearningRecord,
  onCompletionStatusChange,
  onStatusChange,
  
  // 수업 일정 관련
  classSessions = [],
  regularSchedule,
  onAddClassSession,
  onUpdateClassSession,
  onDeleteClassSession,
  onUpdateRegularSchedule,
  
  // 숙제 관련
  homework = [],
  onAddHomework,
  onUpdateHomework,
  onDeleteHomework,
  
  // 시험 기록 관련
  examRecords = [],
  onAddExam,
  onUpdateExam,
  onDeleteExam
}: StudentDetailProps) {
  const subMenuItems = [
    { id: 'dashboard', label: '대시보드' },
    { id: 'unitManagement', label: '단원 진행 현황' },
    { id: 'errorAnalysis', label: '오답 분석' },
    { id: 'statsReport', label: '통계 리포트' },
    { id: 'learningHistory', label: '학습 기록' },
    { id: 'classSchedule', label: '수업 일정' },
    { id: 'homework', label: '숙제' },
    { id: 'examRecords', label: '시험 기록' }
  ];

  const renderSubPage = () => {
    const commonProps = {
      units,
      onDifficultyChange,
      onNameChange,
      onDelete,
      onErrorChange,
      onAddUnit,
      onStatusChange,
      onCompletionStatusChange,
      isAdmin: true,
      showAddButton: false // 관리자가 학생 관리 페이지에서는 단원 추가 버튼 숨김
    };

    switch (currentSubPage) {
      case 'dashboard':
        return <Dashboard {...commonProps} />;
      case 'unitManagement':
        return <UnitManagement {...commonProps} />;
      case 'errorAnalysis':
        return <ErrorAnalysis units={units} />;
      case 'statsReport':
        return <StatsReport units={units} />;
      case 'learningHistory':
        return <LearningHistory 
          isAdmin={true} 
          records={learningRecords}
          onAdd={onAddLearningRecord}
          onUpdate={onUpdateLearningRecord}
          onDelete={onDeleteLearningRecord}
        />;
      case 'classSchedule':
        return <ClassSchedule 
          isAdmin={true}
          sessions={classSessions}
          regularSchedule={regularSchedule}
          onAddSession={onAddClassSession}
          onUpdateSession={onUpdateClassSession}
          onDeleteSession={onDeleteClassSession}
          onUpdateRegularSchedule={onUpdateRegularSchedule}
        />;
      case 'homework':
        return <Homework 
          isAdmin={true}
          homework={homework}
          onAddHomework={onAddHomework}
          onUpdateHomework={onUpdateHomework}
          onDeleteHomework={onDeleteHomework}
        />;
      case 'examRecords':
        return <ExamRecords 
          isAdmin={true}
          exams={examRecords}
          onAddExam={onAddExam}
          onUpdateExam={onUpdateExam}
          onDeleteExam={onDeleteExam}
        />;
      default:
        return <Dashboard {...commonProps} />;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Student Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-[1440px] mx-auto px-8 py-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft size={20} />
            <span>학생 목록으로 돌아가기</span>
          </button>

          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center border-2 border-gray-200">
              <User size={40} className="text-gray-600" />
            </div>
          
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{student.name}</h1>
              <div className="flex items-center gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{student.grade}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail size={14} />
                  <span>{student.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={14} />
                  <span>{student.phone}</span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <p className="text-sm text-gray-600 mb-1">학습 진도</p>
              <p className="text-4xl font-bold text-gray-900">{student.progress}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sub Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-[1440px] mx-auto px-8">
          <nav className="flex gap-1">
            {subMenuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`px-6 py-4 font-medium transition-colors relative ${
                  currentSubPage === item.id
                    ? 'text-gray-900'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {item.label}
                {currentSubPage === item.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900" />
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        {renderSubPage()}
      </div>
    </div>
  );
}