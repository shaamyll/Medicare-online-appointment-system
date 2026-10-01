import apiClient, { ApiResponse } from '@/lib/axios';
import {
  AuthResponse,
  LoginCredentials,
  RegisterData,
  PatientRegisterData,
  DoctorRegisterData,
  User,
} from '../types/auth.types';

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', credentials);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Login failed');
    }
    return response.data.data;
  },

  doctorLogin: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/doctor/login', credentials);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Doctor login failed');
    }
    return response.data.data;
  },

  register: async (data: PatientRegisterData | RegisterData): Promise<AuthResponse> => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/register', data);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Registration failed');
    }
    return response.data.data;
  },

  doctorRegister: async (data: DoctorRegisterData): Promise<AuthResponse> => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/doctor/register', data);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Doctor registration failed');
    }
    return response.data.data;
  },

  me: async (): Promise<{ user: User; profile: any }> => {
    const response = await apiClient.get<ApiResponse<{ user: User; profile: any }>>('/auth/me');
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to fetch profile');
    }
    return response.data.data;
  },

  checkHealth: async () => {
    const response = await apiClient.get<ApiResponse<any>>('/health');
    return response.data;
  }
};
