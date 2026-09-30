import apiClient, { ApiResponse } from '@/lib/axios';
import { Doctor } from '../types/doctor.types';

export const doctorsApi = {
  getAll: async (): Promise<Doctor[]> => {
    const response = await apiClient.get<ApiResponse<Doctor[]>>('/doctors');
    return response.data.data || [];
  },

  getById: async (id: number): Promise<Doctor> => {
    const response = await apiClient.get<ApiResponse<Doctor>>(`/doctors/${id}`);
    if (!response.data.data) {
      throw new Error('Doctor not found');
    }
    return response.data.data;
  },
};
