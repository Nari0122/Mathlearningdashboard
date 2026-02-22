import { Home, Calendar, BookCheck, FileText, ClipboardList, LogOut } from 'lucide-react';

interface StudentSidebarProps {
  currentView: 'dashboard' | 'classSchedule' | 'homework' | 'examRecords' | 'learningHistory' | 'myLearning';
  onNavigate: (view: 'dashboard' | 'classSchedule' | 'homework' | 'examRecords' | 'learningHistory' | 'myLearning') => void;
  onLogout: () => void;
  studentName: string;
}

export function StudentSidebar({ currentView, onNavigate, onLogout, studentName }: StudentSidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: '대시보드', icon: Home },
    { id: 'classSchedule', label: '수업일정', icon: Calendar },
    { id: 'homework', label: '숙제', icon: BookCheck },
    { id: 'examRecords', label: '시험기록', icon: FileText },
    { id: 'learningHistory', label: '학습기록', icon: ClipboardList },
    { id: 'myLearning', label: '나의학습', icon: BookCheck }
  ];

  return (
    <div className="w-64 bg-[#1e293b] text-white h-screen flex flex-col">
      {/* Logo/Header */}
      <div className="p-6 border-b border-gray-700">
        <h1 className="text-2xl font-bold mb-1">MATHCLINIC</h1>
        <p className="text-sm text-gray-400">{studentName} 학생</p>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-red-600 hover:text-white transition-all"
        >
          <LogOut size={20} />
          <span className="font-medium">로그아웃</span>
        </button>
      </div>
    </div>
  );
}
