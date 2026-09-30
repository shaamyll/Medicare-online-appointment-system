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

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  bloodGroup?: string;
  specialization?: string;
  departmentId?: number;
}

export interface AuthResponse {
  token: string;
  user: User;
  profile?: any;
}
