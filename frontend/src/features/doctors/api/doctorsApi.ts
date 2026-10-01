import apiClient, { ApiResponse } from '@/lib/axios';
import { Doctor, DoctorSchedule } from '../types/doctor.types';

export const doctorsApi = {
  getAll: async (params?: { departmentId?: number; search?: string }): Promise<Doctor[]> => {
    const response = await apiClient.get<ApiResponse<Doctor[]>>('/doctors', { params });
    return response.data.data || [];
  },

  getById: async (id: number): Promise<Doctor> => {
    const response = await apiClient.get<ApiResponse<Doctor>>(`/doctors/${id}`);
    if (!response.data.data) {
      throw new Error('Doctor not found');
    }
    return response.data.data;
  },

  getMySchedule: async (): Promise<DoctorSchedule[]> => {
    const response = await apiClient.get<ApiResponse<DoctorSchedule[]>>('/doctor/schedule');
    return response.data.data || [];
  },

  updateMySchedule: async (schedules: DoctorSchedule[]): Promise<DoctorSchedule[]> => {
    const response = await apiClient.put<ApiResponse<DoctorSchedule[]>>('/doctor/schedule', schedules);
    return response.data.data || [];
  },

  getMyProfile: async (): Promise<Doctor> => {
    const response = await apiClient.get<ApiResponse<Doctor>>('/doctor/profile');
    return response.data.data!;
  },

  updateMyProfile: async (data: Partial<Doctor>): Promise<Doctor> => {
    const response = await apiClient.put<ApiResponse<Doctor>>('/doctor/profile', data);
    return response.data.data!;
  },
};
