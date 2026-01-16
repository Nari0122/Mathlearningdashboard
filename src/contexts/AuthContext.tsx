import { createContext, useContext, useState, ReactNode } from 'react';
import { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  login: (loginId: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  hasRole: (role: UserRole) => boolean;
  addUser: (userData: { loginId: string; password: string; name: string; role: UserRole }) => void;
  updateUser: (loginId: string, updates: { newLoginId?: string; newPassword?: string; name?: string }) => boolean;
  updateCurrentUserPassword: (currentPassword: string, newPassword: string) => { success: boolean; error?: string };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Initial mock users
const INITIAL_USERS: Array<User & { password: string }> = [
  {
    userId: 1,
    role: 'admin',
    name: '김선생',
    loginId: 'admin',
    password: 'admin123',
    createdAt: '2026-01-01',
    lastLogin: '2026-01-12'
  },
  {
    userId: 2,
    role: 'student',
    name: '강나리',
    loginId: 'student1',
    password: 'pass123',
    createdAt: '2026-01-05',
    lastLogin: '2026-01-12'
  },
  {
    userId: 3,
    role: 'student',
    name: '김민수',
    loginId: 'student2',
    password: 'pass123',
    createdAt: '2026-01-05',
    lastLogin: '2026-01-11'
  }
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [mockUsers, setMockUsers] = useState<Array<User & { password: string }>>(INITIAL_USERS);

  const login = async (loginId: string, password: string): Promise<boolean> => {
    // Mock authentication
    const foundUser = mockUsers.find(
      u => u.loginId === loginId && u.password === password
    );

    if (foundUser) {
      const { password: _, ...userWithoutPassword } = foundUser;
      setUser({
        ...userWithoutPassword,
        lastLogin: new Date().toISOString()
      });
      return true;
    }

    return false;
  };

  const addUser = (userData: { loginId: string; password: string; name: string; role: UserRole }) => {
    const newUserId = Math.max(...mockUsers.map(u => u.userId), 0) + 1;
    const newUser: User & { password: string } = {
      userId: newUserId,
      role: userData.role,
      name: userData.name,
      loginId: userData.loginId,
      password: userData.password,
      createdAt: new Date().toISOString().split('T')[0],
      lastLogin: ''
    };
    setMockUsers([...mockUsers, newUser]);
  };

  const updateUser = (loginId: string, updates: { newLoginId?: string; newPassword?: string; name?: string }) => {
    const userIndex = mockUsers.findIndex(u => u.loginId === loginId);
    if (userIndex === -1) return false;

    const updatedUser: User & { password: string } = {
      ...mockUsers[userIndex],
      loginId: updates.newLoginId || mockUsers[userIndex].loginId,
      password: updates.newPassword || mockUsers[userIndex].password,
      name: updates.name || mockUsers[userIndex].name
    };

    const newMockUsers = [...mockUsers];
    newMockUsers[userIndex] = updatedUser;
    setMockUsers(newMockUsers);
    return true;
  };

  const updateCurrentUserPassword = (currentPassword: string, newPassword: string): { success: boolean; error?: string } => {
    if (!user) {
      return { success: false, error: 'No user logged in' };
    }

    // 현재 사용자 찾기
    const userIndex = mockUsers.findIndex(u => u.loginId === user.loginId);
    if (userIndex === -1) {
      return { success: false, error: 'User not found' };
    }

    // 현재 비밀번호 검증
    if (mockUsers[userIndex].password !== currentPassword) {
      return { success: false, error: 'Current password is incorrect' };
    }

    // 비밀번호 업데이트
    const updatedUser: User & { password: string } = {
      ...mockUsers[userIndex],
      password: newPassword
    };

    const newMockUsers = [...mockUsers];
    newMockUsers[userIndex] = updatedUser;
    setMockUsers(newMockUsers);

    return { success: true };
  };

  const logout = () => {
    setUser(null);
  };

  const isAuthenticated = user !== null;

  const hasRole = (role: UserRole) => {
    return user?.role === role;
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated, hasRole, addUser, updateUser, updateCurrentUserPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}