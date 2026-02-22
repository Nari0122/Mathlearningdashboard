export type UserRole = 'admin' | 'student';

export interface User {
  userId: number;
  role: UserRole;
  name: string;
  loginId: string;
  createdAt: string;
  lastLogin?: string;
}

export interface StudentProfile {
  studentId: number;
  grade: string;
  class?: string;
  memo?: string;
  statusSummary: string;
  updatedAt: string;
}

export interface Unit {
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
}

export interface StudentUnitProgress {
  studentId: number;
  unitId: number;
  conceptCount: number;
  calcCount: number;
  readingCount: number;
  strategyCount: number;
  status: string;
  updatedAt: string;
}

export interface Student {
  id: number;
  name: string;
  grade: string;
  class?: string;
  email: string;
  phone: string;
  loginId: string;
  progress: number;
  statusSummary: string;
  lastUpdated: string;
  isActive: boolean;
}
