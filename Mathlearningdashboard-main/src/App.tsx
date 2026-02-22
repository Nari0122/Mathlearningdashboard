import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './pages/Login';
import { AccessDenied } from './pages/AccessDenied';
import { Sidebar } from './components/Sidebar';
import { StudentSidebar } from './components/StudentSidebar';
import { StudentLayout } from './components/StudentLayout';
import { Header } from './components/Header';
import { SupportModal } from './components/SupportModal';
import { TabNavigation } from './components/TabNavigation';
import { Dashboard } from './pages/Dashboard';
import { UnitManagement } from './pages/UnitManagement';
import { ErrorAnalysis } from './pages/ErrorAnalysis';
import { StatsReport } from './pages/StatsReport';
import { LearningHistory } from './pages/LearningHistory';
import { ClassSchedule } from './pages/ClassSchedule';
import { Homework } from './pages/Homework';
import { ExamRecords } from './pages/ExamRecords';
import { AdminStudentManagement } from './pages/AdminStudentManagement';
import { StudentAccountManagement } from './pages/StudentAccountManagement';
import { StudentDetail } from './pages/StudentDetail';
import { StudentDashboard } from './pages/StudentDashboard';
import { MyLearning } from './pages/MyLearning';
import { Student } from './types';
import { LogOut } from 'lucide-react';
import { calculateProgress, getProgressStatus } from './utils/progressCalculator';

function AppContent() {
  const { user, isAuthenticated, hasRole, logout, addUser, updateUser } = useAuth();
  const [currentPage, setCurrentPage] = useState('');
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [showAccessDenied, setShowAccessDenied] = useState(false);
  
  // 관리자 - 학생 관리 페이지 관련 state
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [isManagingAccount, setIsManagingAccount] = useState(false); // 계정 관리 모드
  const [studentSubPage, setStudentSubPage] = useState('dashboard'); // 학생 상세보기 서브페이지
  
  // 학생 페이지 - 학습 기록 페이지 라우팅
  const [studentView, setStudentView] = useState<'dashboard' | 'learningHistory' | 'myLearning' | 'classSchedule' | 'homework' | 'examRecords'>('dashboard');

  // 학생별 데이터 관리 (studentId를 키로 사용)
  const [studentData, setStudentData] = useState<{
    [studentId: number]: {
      units: Array<{
        id: number;
        name: string;
        status: 'HIGH' | 'MID' | 'LOW';
        errors: { C: number; M: number; R: number; S: number };
        selectedDifficulty: string;
        completionStatus: 'incomplete' | 'in-progress' | 'completed';
      }>;
      learningRecords: Array<{
        id: number;
        date: string;
        progress: string;
        comment: string;
        createdBy: 'admin' | 'student';
      }>;
      classSessions: Array<{
        id: number;
        date: string;
        dayOfWeek: string;
        startTime: string;
        endTime: string;
        status: 'scheduled' | 'completed' | 'absent' | 'makeup' | 'cancelled';
        notes?: string;
      }>;
      homework: Array<{
        id: number;
        title: string;
        description: string;
        assignedDate: string;
        dueDate: string;
        status: 'pending' | 'submitted' | 'overdue';
        feedback?: string;
      }>;
      examRecords: Array<{
        id: number;
        examType: string;
        subject: string;
        date: string;
        score: number;
        maxScore?: number;
        notes?: string;
      }>;
      regularSchedule?: Array<{
        id: number;
        dayOfWeek: string;
        startTime: string;
        endTime: string;
      }>;
    };
  }>({
    1: {
      // 김민수의 데이터
      units: [
        {
          id: 1,
          name: '집합과 명제',
          status: 'HIGH' as const,
          errors: { C: 2, M: 1, R: 0, S: 1 },
          selectedDifficulty: '상',
          completionStatus: 'completed' as const
        },
        {
          id: 2,
          name: '함수',
          status: 'MID' as const,
          errors: { C: 1, M: 2, R: 1, S: 0 },
          selectedDifficulty: '중',
          completionStatus: 'in-progress' as const
        }
      ],
      learningRecords: [
        { 
          id: 1, 
          date: '2026-01-12', 
          progress: '집합과 명제 3-2단원 완료', 
          comment: '개념 이해도 우수. 다음 시간 문제 풀이 예정.',
          createdBy: 'admin' as const
        }
      ],
      classSessions: [
        { id: 1, date: '2026-01-14', dayOfWeek: '화요일', startTime: '16:00', endTime: '18:00', status: 'scheduled' as const, notes: '집합과 명제 복습' }
      ],
      homework: [
        { id: 1, title: '수학 문제집 p.24-28', description: '이차방정식 연습문제 풀이', assignedDate: '2026-01-10', dueDate: '2026-01-15', status: 'pending' as const, feedback: '' }
      ],
      examRecords: [
        { id: 1, examType: '중간고사', subject: '수학', date: '2026-01-10', score: 85, maxScore: 100, notes: '실수가 좀 있었음' }
      ],
      regularSchedule: [{ id: 1, dayOfWeek: '화요일', startTime: '16:00', endTime: '18:00' }]
    },
    5: {
      // 강나리의 데이터 (student1 - 로그인 가능한 학생)
      units: [
        {
          id: 1,
          name: '집합과 명제',
          status: 'HIGH' as const,
          errors: { C: 2, M: 1, R: 0, S: 1 },
          selectedDifficulty: '상',
          completionStatus: 'completed' as const
        },
        {
          id: 2,
          name: '함수',
          status: 'MID' as const,
          errors: { C: 1, M: 2, R: 1, S: 0 },
          selectedDifficulty: '중',
          completionStatus: 'in-progress' as const
        },
        {
          id: 3,
          name: '방정식과 부등식',
          status: 'LOW' as const,
          errors: { C: 0, M: 1, R: 0, S: 1 },
          selectedDifficulty: '하',
          completionStatus: 'completed' as const
        },
        {
          id: 4,
          name: '도형의 방정식',
          status: 'MID' as const,
          errors: { C: 2, M: 0, R: 1, S: 2 },
          selectedDifficulty: '상',
          completionStatus: 'incomplete' as const
        }
      ],
      learningRecords: [
        { 
          id: 1, 
          date: '2026-01-12', 
          progress: '집합과 명제 3-2단원 완료', 
          comment: '개념 이해도 우수. 다음 시간 문제 풀이 예정.',
          createdBy: 'admin' as const
        },
        { 
          id: 2, 
          date: '2026-01-11', 
          progress: '함수 1-1단원 학습', 
          comment: '함수 그래프 그리기 연습 필요. 숙제: 연습문제 5개',
          createdBy: 'admin' as const
        },
        { 
          id: 3, 
          date: '2026-01-10', 
          progress: '방정식과 부등식 복습', 
          comment: '이차방정식 실수 줄어듦. 잘하고 있음!',
          createdBy: 'admin' as const
        }
      ],
      classSessions: [
        { id: 1, date: '2026-01-14', dayOfWeek: '화요일', startTime: '16:00', endTime: '18:00', status: 'scheduled' as const, notes: '집합과 명제 복습' },
        { id: 2, date: '2026-01-07', dayOfWeek: '화요일', startTime: '16:00', endTime: '18:00', status: 'completed' as const, notes: '함수 그래프 학습' }
      ],
      homework: [
        { id: 1, title: '수학 문제집 p.24-28', description: '이차방정식 연습문제 풀이', assignedDate: '2026-01-10', dueDate: '2026-01-15', status: 'pending' as const, feedback: '' },
        { id: 2, title: '함수 그래프 그리기', description: '3개 함수 그래프 노트에 작성', assignedDate: '2026-01-08', dueDate: '2026-01-12', status: 'submitted' as const, feedback: '잘 했습니다!' }
      ],
      examRecords: [
        { id: 1, examType: '중간고사', subject: '수학', date: '2026-01-10', score: 85, maxScore: 100, notes: '실수가 좀 있었음' },
        { id: 2, examType: '기말고사', subject: '수학', date: '2025-12-20', score: 78, maxScore: 100, notes: '함수 파트 약함' }
      ],
      regularSchedule: [{ id: 1, dayOfWeek: '화요일', startTime: '16:00', endTime: '18:00' }]
    }
  });

  // 학생 목록 데이터
  const [students, setStudents] = useState<Student[]>([
    { 
      id: 1, 
      name: '김민수', 
      grade: '고1', 
      class: '1반',
      email: 'minsu@example.com', 
      phone: '010-1111-2222', 
      loginId: 'student2',
      progress: 85,
      statusSummary: '양호',
      lastUpdated: '2026-01-12',
      isActive: true
    },
    { 
      id: 2, 
      name: '이서연', 
      grade: '고2', 
      class: '2반',
      email: 'seoyeon@example.com', 
      phone: '010-3333-4444',
      loginId: 'student3',
      progress: 72,
      statusSummary: '보통',
      lastUpdated: '2026-01-11',
      isActive: true
    },
    { 
      id: 3, 
      name: '박지훈', 
      grade: '고1',
      class: '3반',
      email: 'jihoon@example.com', 
      phone: '010-5555-6666',
      loginId: 'student4',
      progress: 90,
      statusSummary: '우수',
      lastUpdated: '2026-01-12',
      isActive: true
    },
    { 
      id: 4, 
      name: '최유진', 
      grade: '고3',
      email: 'yujin@example.com', 
      phone: '010-7777-8888',
      loginId: 'student5',
      progress: 68,
      statusSummary: '보통',
      lastUpdated: '2026-01-10',
      isActive: true
    },
    {
      id: 5,
      name: '강나리',
      grade: '고2',
      class: '1반',
      email: 'kang@example.com',
      phone: '010-9999-0000',
      loginId: 'student1',
      progress: 78,
      statusSummary: '양호',
      lastUpdated: '2026-01-12',
      isActive: true
    }
  ]);

  // Set initial page based on user role
  useEffect(() => {
    if (isAuthenticated && user) {
      if (hasRole('admin')) {
        setCurrentPage('studentManagement');
      } else if (hasRole('student')) {
        setCurrentPage('dashboard');
      }
    }
  }, [isAuthenticated, user, hasRole]);

  // 현재 활성화된 학생 ID 가져오기 (관리자는 selectedStudentId, 학생은 본인 ID)
  const getCurrentStudentId = (): number | null => {
    if (hasRole('admin')) {
      return selectedStudentId;
    } else if (hasRole('student') && user) {
      // 학생이 로그인한 경우, students 배열에서 해당 loginId로 ID 찾기
      const currentStudent = students.find(s => s.loginId === user.loginId);
      return currentStudent?.id || null;
    }
    return null;
  };

  // 현재 학생의 데이터 가져오기
  const getCurrentStudentData = () => {
    const studentId = getCurrentStudentId();
    if (studentId === null) {
      return {
        units: [],
        learningRecords: [],
        classSessions: [],
        homework: [],
        examRecords: [],
        regularSchedule: undefined
      };
    }
    return studentData[studentId] || {
      units: [],
      learningRecords: [],
      classSessions: [],
      homework: [],
      examRecords: [],
      regularSchedule: undefined
    };
  };

  // 단원 변경 시 학생 진도 자동 계산 (학생별로)
  useEffect(() => {
    const studentId = getCurrentStudentId();
    if (studentId && studentData[studentId]) {
      const units = studentData[studentId]?.units || [];
      if (units.length > 0) {
        const newProgress = calculateProgress(units);
        const newStatusSummary = getProgressStatus(newProgress);
        
        // 해당 학생의 progress만 업데이트
        setStudents(prevStudents => 
          prevStudents.map(s => 
            s.id === studentId ? {
              ...s, 
              progress: newProgress,
              statusSummary: newStatusSummary,
              lastUpdated: new Date().toISOString().split('T')[0]
            } : s
          )
        );
      }
    }
  }, [studentData, selectedStudentId, user]);

  const handleDifficultyChange = (unitId: number, difficulty: string) => {
    const studentId = getCurrentStudentId();
    if (studentId === null) return;
    
    setStudentData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        units: prev[studentId].units.map(unit => 
          unit.id === unitId 
            ? { ...unit, selectedDifficulty: difficulty }
            : unit
        )
      }
    }));
  };

  const handleAddUnit = (unitName?: string) => {
    const studentId = getCurrentStudentId();
    if (studentId === null) return;
    
    const currentUnits = studentData[studentId]?.units || [];
    const newId = Math.max(...currentUnits.map(u => u.id), 0) + 1;
    const newUnit = {
      id: newId,
      name: unitName || `새 단원 ${newId}`,
      status: 'MID' as const,
      errors: { C: 0, M: 0, R: 0, S: 0 },
      selectedDifficulty: '중',
      completionStatus: 'incomplete' as 'incomplete' | 'in-progress' | 'completed'
    };
    
    setStudentData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        units: [...currentUnits, newUnit]
      }
    }));
  };

  const handleNameChange = (unitId: number, newName: string) => {
    const studentId = getCurrentStudentId();
    if (studentId === null) return;
    
    setStudentData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        units: prev[studentId].units.map(unit => 
          unit.id === unitId 
            ? { ...unit, name: newName }
            : unit
        )
      }
    }));
  };

  const handleDeleteUnit = (unitId: number) => {
    const studentId = getCurrentStudentId();
    if (studentId === null) return;
    
    setStudentData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        units: prev[studentId].units.filter(unit => unit.id !== unitId)
      }
    }));
  };

  const handleErrorChange = (unitId: number, errorType: 'C' | 'M' | 'R' | 'S', delta: number) => {
    const studentId = getCurrentStudentId();
    if (studentId === null) return;
    
    setStudentData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        units: prev[studentId].units.map(unit => {
          if (unit.id === unitId) {
            const newCount = Math.max(0, unit.errors[errorType] + delta);
            return {
              ...unit,
              errors: {
                ...unit.errors,
                [errorType]: newCount
              }
            };
          }
          return unit;
        })
      }
    }));
  };

  // 단원 완료 상태 변경
  const handleCompletionStatusChange = (unitId: number, status: 'incomplete' | 'in-progress' | 'completed') => {
    const studentId = getCurrentStudentId();
    if (studentId === null) return;
    
    setStudentData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        units: prev[studentId].units.map(unit => 
          unit.id === unitId 
            ? { ...unit, completionStatus: status }
            : unit
        )
      }
    }));
  };

  // 단원 난이도(status) 변경 (관리자 설정)
  const handleStatusChange = (unitId: number, status: 'HIGH' | 'MID' | 'LOW') => {
    const studentId = getCurrentStudentId();
    if (studentId === null) return;
    
    setStudentData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        units: prev[studentId].units.map(unit => 
          unit.id === unitId 
            ? { ...unit, status }
            : unit
        )
      }
    }));
  };

  // 학습 기록 CRUD
  const handleAddLearningRecord = (record: { date: string; progress: string; comment: string }) => {
    const studentId = getCurrentStudentId();
    if (studentId === null) return;
    
    const newRecord = {
      id: Math.max(...studentData[studentId].learningRecords.map(r => r.id), 0) + 1,
      ...record,
      createdBy: 'admin' as 'admin' | 'student'
    };
    setStudentData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        learningRecords: [newRecord, ...prev[studentId].learningRecords]
      }
    }));
  };

  const handleUpdateLearningRecord = (id: number, record: { date: string; progress: string; comment: string }) => {
    const studentId = getCurrentStudentId();
    if (studentId === null) return;
    
    setStudentData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        learningRecords: prev[studentId].learningRecords.map(r => 
          r.id === id ? { ...r, ...record } : r
        )
      }
    }));
  };

  const handleDeleteLearningRecord = (id: number) => {
    const studentId = getCurrentStudentId();
    if (studentId === null) return;
    
    setStudentData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        learningRecords: prev[studentId].learningRecords.filter(r => r.id !== id)
      }
    }));
  };

  // 수업 일정 CRUD
  const handleAddClassSession = (session: Omit<typeof studentData[number]['classSessions'][number], 'id'>) => {
    const studentId = getCurrentStudentId();
    if (studentId === null) return;
    
    const currentSessions = studentData[studentId]?.classSessions || [];
    const newSession = {
      id: Math.max(...currentSessions.map(s => s.id), 0) + 1,
      ...session
    };
    
    setStudentData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        classSessions: [newSession, ...currentSessions]
      }
    }));
  };

  const handleUpdateClassSession = (id: number, session: Partial<typeof studentData[number]['classSessions'][number]>) => {
    const studentId = getCurrentStudentId();
    if (studentId === null) return;
    
    setStudentData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        classSessions: prev[studentId].classSessions.map(s => 
          s.id === id ? { ...s, ...session } : s
        )
      }
    }));
  };

  const handleDeleteClassSession = (id: number) => {
    const studentId = getCurrentStudentId();
    if (studentId === null) return;
    
    setStudentData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        classSessions: prev[studentId].classSessions.filter(s => s.id !== id)
      }
    }));
  };

  const handleUpdateRegularSchedule = (schedule: Array<{ id: number; dayOfWeek: string; startTime: string; endTime: string }> | undefined) => {
    const studentId = getCurrentStudentId();
    if (studentId === null) return;
    
    setStudentData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        regularSchedule: schedule
      }
    }));
  };

  // 숙제 CRUD
  const handleAddHomework = (homework: Omit<typeof studentData[number]['homework'][number], 'id'>) => {
    const studentId = getCurrentStudentId();
    if (studentId === null) return;
    
    const currentHomework = studentData[studentId]?.homework || [];
    const newHomework = {
      id: Math.max(...currentHomework.map(h => h.id), 0) + 1,
      ...homework
    };
    
    setStudentData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        homework: [newHomework, ...currentHomework]
      }
    }));
  };

  const handleUpdateHomework = (id: number, homework: Partial<typeof studentData[number]['homework'][number]>) => {
    const studentId = getCurrentStudentId();
    if (studentId === null) return;
    
    setStudentData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        homework: prev[studentId].homework.map(h => 
          h.id === id ? { ...h, ...homework } : h
        )
      }
    }));
  };

  const handleDeleteHomework = (id: number) => {
    const studentId = getCurrentStudentId();
    if (studentId === null) return;
    
    setStudentData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        homework: prev[studentId].homework.filter(h => h.id !== id)
      }
    }));
  };

  // 시험 기록 CRUD
  const handleAddExam = (exam: Omit<typeof studentData[number]['examRecords'][number], 'id'>) => {
    const studentId = getCurrentStudentId();
    if (studentId === null) return;
    
    const currentExams = studentData[studentId]?.examRecords || [];
    const newExam = {
      id: Math.max(...currentExams.map(e => e.id), 0) + 1,
      ...exam
    };
    
    setStudentData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        examRecords: [newExam, ...currentExams]
      }
    }));
  };

  const handleUpdateExam = (id: number, exam: Partial<typeof studentData[number]['examRecords'][number]>) => {
    const studentId = getCurrentStudentId();
    if (studentId === null) return;
    
    setStudentData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        examRecords: prev[studentId].examRecords.map(e => 
          e.id === id ? { ...e, ...exam } : e
        )
      }
    }));
  };

  const handleDeleteExam = (id: number) => {
    const studentId = getCurrentStudentId();
    if (studentId === null) return;
    
    setStudentData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        examRecords: prev[studentId].examRecords.filter(e => e.id !== id)
      }
    }));
  };

  // 학생 추가
  const handleAddStudent = (studentData: Omit<Student, 'id' | 'progress' | 'statusSummary' | 'lastUpdated' | 'isActive'>) => {
    const newId = Math.max(...students.map(s => s.id), 0) + 1;
    
    // 학습 진행률 계산 (초기 학생은 0%)
    const progress = 0;
    const statusSummary = getProgressStatus(progress);
    
    const newStudent: Student = {
      ...studentData,
      id: newId,
      progress,
      statusSummary,
      lastUpdated: new Date().toISOString().split('T')[0],
      isActive: true
    };
    setStudents([...students, newStudent]);
    
    // 신규 학생의 빈 데이터 초기화
    setStudentData(prev => ({
      ...prev,
      [newId]: {
        units: [],
        learningRecords: [],
        classSessions: [],
        homework: [],
        examRecords: []
      }
    }));
    
    // AuthContext에 로그인 가능한 사용자 추가 (중요!)
    addUser({
      loginId: studentData.loginId,
      password: (studentData as any).tempPassword || 'default123', // tempPassword 사용
      name: studentData.name,
      role: 'student'
    });
  };

  // 학생 정보 업데이트
  const handleUpdateStudent = (updatedStudent: Student, newPassword?: string) => {
    // 기존 학생의 loginId 찾기
    const originalStudent = students.find(s => s.id === updatedStudent.id);
    
    if (originalStudent) {
      // AuthContext의 User 데이 업데이트 (로그인 정보)
      const updateSuccess = updateUser(originalStudent.loginId, {
        newLoginId: updatedStudent.loginId,
        newPassword: newPassword || undefined,
        name: updatedStudent.name
      });
      
      if (updateSuccess) {
        // Student 데이터 업데이트
        setStudents(students.map(s => 
          s.id === updatedStudent.id ? updatedStudent : s
        ));
      }
    }
  };

  // 학생 삭제 (관리자 전용)
  const handleDeleteStudent = (studentId: number) => {
    // isActive 상태를 토글
    setStudents(students.map(s => 
      s.id === studentId ? { ...s, isActive: !s.isActive } : s
    ));
  };

  // 학생 계정 관리 모드로 전환 (관리자 전용)
  const handleStudentManage = (studentId: number) => {
    if (hasRole('admin')) {
      setSelectedStudentId(studentId);
      setIsManagingAccount(true);
    }
  };

  // 학생 목록으로 돌아가기
  const handleBackToStudentList = () => {
    setSelectedStudentId(null);
    setIsManagingAccount(false);
    setCurrentPage('studentManagement');
  };

  // 학생 상세보기 진입 (관리자 전용)
  const handleStudentSelect = (studentId: number) => {
    if (hasRole('admin')) {
      setSelectedStudentId(studentId);
      setIsManagingAccount(false); // 계정 관리 모드 해제
    }
  };

  // 학생 상세 내 네비게이션
  const handleStudentSubPageNavigate = (subPage: string) => {
    setStudentSubPage(subPage);
  };

  // 페이지 네비게이션 (권한 체크 포함)
  const handleNavigate = (page: string) => {
    // Student trying to access student management
    if (page === 'studentManagement' && hasRole('student')) {
      setShowAccessDenied(true);
      return;
    }
    
    setCurrentPage(page);
    setSelectedStudentId(null);
  };

  const handleLogout = () => {
    logout();
    setCurrentPage('');
    setSelectedStudentId(null);
  };

  const handleLoginSuccess = () => {
    // Page will be set by useEffect based on role
  };

  // Show access denied page
  if (showAccessDenied) {
    return <AccessDenied onGoBack={() => setShowAccessDenied(false)} />;
  }

  // Not authenticated - show login
  if (!isAuthenticated || !user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  const commonProps = {
    units: getCurrentStudentData().units,
    onDifficultyChange: handleDifficultyChange,
    onNameChange: handleNameChange,
    onDelete: handleDeleteUnit,
    onErrorChange: handleErrorChange,
    onAddUnit: handleAddUnit
  };

  const renderPage = () => {
    // 관리자 - 학생 계정 관리 모드
    if (selectedStudentId !== null && hasRole('admin') && isManagingAccount) {
      const student = students.find(s => s.id === selectedStudentId);
      if (student) {
        return (
          <StudentAccountManagement
            student={student}
            onBack={handleBackToStudentList}
            onSave={handleUpdateStudent}
            onDelete={handleDeleteStudent}
          />
        );
      }
    }

    // 관리자 - 학생 상세보기 모드 (기존 기능: 대시보드/단원관리/오답분석 등)
    if (selectedStudentId !== null && hasRole('admin') && !isManagingAccount) {
      const student = students.find(s => s.id === selectedStudentId);
      if (student) {
        const currentData = getCurrentStudentData();
        return (
          <StudentDetail
            student={student}
            currentSubPage={studentSubPage}
            onNavigate={handleStudentSubPageNavigate}
            onBack={handleBackToStudentList}
            learningRecords={currentData.learningRecords}
            onAddLearningRecord={handleAddLearningRecord}
            onUpdateLearningRecord={handleUpdateLearningRecord}
            onDeleteLearningRecord={handleDeleteLearningRecord}
            onCompletionStatusChange={handleCompletionStatusChange}
            onStatusChange={handleStatusChange}
            classSessions={currentData.classSessions}
            regularSchedule={currentData.regularSchedule}
            onAddClassSession={handleAddClassSession}
            onUpdateClassSession={handleUpdateClassSession}
            onDeleteClassSession={handleDeleteClassSession}
            onUpdateRegularSchedule={handleUpdateRegularSchedule}
            homework={currentData.homework}
            onAddHomework={handleAddHomework}
            onUpdateHomework={handleUpdateHomework}
            onDeleteHomework={handleDeleteHomework}
            examRecords={currentData.examRecords}
            onAddExam={handleAddExam}
            onUpdateExam={handleUpdateExam}
            onDeleteExam={handleDeleteExam}
            {...commonProps}
          />
        );
      }
    }

    // Student role - show student dashboard only
    if (hasRole('student')) {
      return (
        <StudentLayout
          currentView={studentView}
          onNavigate={(view) => setStudentView(view)}
          onLogout={handleLogout}
          studentName={user.name}
        >
          {studentView === 'dashboard' && (
            <StudentDashboard
              studentName={user.name}
              onLogout={handleLogout}
              onNavigateToLearningHistory={() => setStudentView('learningHistory')}
              onNavigateToMyLearning={() => setStudentView('myLearning')}
              onNavigateToClassSchedule={() => setStudentView('classSchedule')}
              onNavigateToHomework={() => setStudentView('homework')}
              onNavigateToExamRecords={() => setStudentView('examRecords')}
              learningRecordsCount={getCurrentStudentData().learningRecords.length}
              {...commonProps}
            />
          )}
          
          {studentView === 'learningHistory' && (
            <LearningHistory 
              isAdmin={false}
              records={getCurrentStudentData().learningRecords}
            />
          )}
          
          {studentView === 'myLearning' && (
            <MyLearning 
              {...commonProps}
            />
          )}
          
          {studentView === 'classSchedule' && (
            <ClassSchedule 
              isAdmin={false}
              sessions={getCurrentStudentData().classSessions}
              regularSchedule={getCurrentStudentData().regularSchedule}
            />
          )}
          
          {studentView === 'homework' && (
            <Homework 
              isAdmin={false}
              homework={getCurrentStudentData().homework}
              onUpdateHomework={handleUpdateHomework}
            />
          )}
          
          {studentView === 'examRecords' && (
            <ExamRecords 
              isAdmin={false}
              exams={getCurrentStudentData().examRecords}
            />
          )}
        </StudentLayout>
      );
    }

    // Admin role - regular pages
    switch (currentPage) {
      case 'studentManagement':
        return (
          <AdminStudentManagement 
            students={students}
            onStudentSelect={handleStudentSelect}
            onStudentManage={handleStudentManage}
            onAddStudent={handleAddStudent}
            onDeleteStudent={handleDeleteStudent}
          />
        );
      default:
        return (
          <AdminStudentManagement 
            students={students}
            onStudentSelect={handleStudentSelect}
            onStudentManage={handleStudentManage}
            onAddStudent={handleAddStudent}
            onDeleteStudent={handleDeleteStudent}
          />
        );
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* 학생은 사이드바 완전 숨김, 관리자는 학생 계정 관리 모드/상세보기 모드에서만 숨김 */}
      {!hasRole('student') && !isManagingAccount && selectedStudentId === null && (
        <Sidebar 
          currentPage={currentPage}
          onNavigate={handleNavigate}
          onSupportClick={() => setIsSupportModalOpen(true)}
          onLogout={handleLogout}
          userRole={user.role}
          userName={user.name}
        />
      )}
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 학생 또는 관리자 계정 관리 모드/상세보기 모드에서는 헤더 숨김 */}
        {!hasRole('student') && !isManagingAccount && selectedStudentId === null && <Header />}
        
        <main className="flex-1 overflow-y-auto">
          {renderPage()}
        </main>
      </div>

      {/* 관리자만 Support 모달 사용 */}
      {hasRole('admin') && (
        <SupportModal 
          isOpen={isSupportModalOpen}
          onClose={() => setIsSupportModalOpen(false)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}