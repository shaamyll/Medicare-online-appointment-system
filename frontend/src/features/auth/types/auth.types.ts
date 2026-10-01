export type UserRole = 'admin' | 'doctor' | 'patient' | 'staff';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  status: string;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface PatientRegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  bloodGroup?: string;
}

export interface DoctorRegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  specialization: string;
  departmentId?: number;
  qualification: string;
  experienceYears: number;
  consultationFee: number;
  bio?: string;
  roomNumber?: string;
}

// Kept for backward compatibility
export type RegisterData = PatientRegisterData & Partial<DoctorRegisterData> & { role?: UserRole };

export interface AuthResponse {
  token: string;
  user: User;
  profile?: any;
  pendingApproval?: boolean;
  message?: string;
}
