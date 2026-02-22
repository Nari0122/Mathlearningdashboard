import { ReactNode } from 'react';
import { StudentSidebar } from './StudentSidebar';

interface StudentLayoutProps {
  currentView: 'dashboard' | 'classSchedule' | 'homework' | 'examRecords' | 'learningHistory' | 'myLearning';
  onNavigate: (view: 'dashboard' | 'classSchedule' | 'homework' | 'examRecords' | 'learningHistory' | 'myLearning') => void;
  onLogout: () => void;
  studentName: string;
  children: ReactNode;
}

export function StudentLayout({ currentView, onNavigate, onLogout, studentName, children }: StudentLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-50">
      <StudentSidebar 
        currentView={currentView}
        onNavigate={onNavigate}
        onLogout={onLogout}
        studentName={studentName}
      />
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
