import { LayoutDashboard, FolderTree, AlertCircle, BarChart3, BookOpen, Users, Settings, HelpCircle, LogOut } from 'lucide-react';
import { UserRole } from '../types';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onSupportClick: () => void;
  onLogout: () => void;
  userRole: UserRole;
  userName: string;
}

const getMenuItems = (role: UserRole) => {
  if (role === 'admin') {
    // 관리자는 "학생 관리" 메뉴만 표시
    return [
      { icon: Users, label: '학생 관리', page: 'studentManagement' },
    ];
  }

  // Student role - 사이드바를 사용하지 않음
  return [];
};

export function Sidebar({ currentPage, onNavigate, onSupportClick, onLogout, userRole, userName }: SidebarProps) {
  const menuItems = getMenuItems(userRole);

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-full shadow-sm">
      {/* Logo Section */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center">
            <span className="text-xl font-bold text-white">M</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">MATHCLINIC</h1>
            <p className="text-xs text-gray-500">LAB</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-gray-200">
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
          <p className="text-xs text-gray-500 mb-1">{userRole === 'admin' ? '관리자' : '학생'}</p>
          <p className="text-sm font-semibold text-gray-900 truncate">강나리</p>
        </div>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.page;
            return (
              <li key={item.label}>
                <button
                  onClick={() => onNavigate(item.page)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom Actions - 관리자만 표시 */}
      {userRole === 'admin' && (
        <div className="p-4 border-t border-gray-200 space-y-2">
          <button 
            onClick={onSupportClick}
            className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-colors"
          >
            <HelpCircle size={20} />
            <span>Support</span>
          </button>
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-100 hover:text-red-600 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            <span>로그아웃</span>
          </button>
        </div>
      )}
    </aside>
  );
}