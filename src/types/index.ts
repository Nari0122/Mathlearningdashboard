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
    name: string;
    grade: string;
    subject: string;
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
    email: string;
    phone: string;
    loginId: string;
    progress: number;
    statusSummary: string;
    lastUpdated: string;
    isActive: boolean;
}
