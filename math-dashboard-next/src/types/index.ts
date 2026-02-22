export type UserRole = 'admin' | 'student';

export interface User {
    userId: number;
    role: UserRole;
    name: string;
    loginId: string;
    createdAt: string;
    lastLogin?: string;
}

export interface Unit {
    id: number;
    schoolLevel: '중등' | '고등';
    grade: string;
    subject: string;
    unitName: string; // "name" in old structure, mapped to unitName
    unitDetails: string[]; // List of selected detailed contents
    name: string; // Keep for backward compatibility/display (can be same as unitName)
    status: 'HIGH' | 'MID' | 'LOW';
    errors: {
        C: number;
        M: number;
        R: number;
        S: number;
    };
    selectedDifficulty: string;
    completionStatus?: 'incomplete' | 'in-progress' | 'completed';
    errorC?: number;
    errorM?: number;
    errorR?: number;
    errorS?: number;
}

export interface Student {
    id: number;
    name: string;
    grade: string;
    class?: string;
    phone: string;
    loginId: string;
    progress: number;
    statusSummary: string;
    lastUpdated: string;
    isActive: boolean;
}
