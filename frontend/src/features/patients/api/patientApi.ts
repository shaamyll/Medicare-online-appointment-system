import apiClient, { ApiResponse } from '@/lib/axios';
import {
  PatientProfileResponse,
  UpdatePatientProfileData,
  ChangePasswordData,
} from '../types/patient.types';

export const patientApi = {
  getProfile: async (): Promise<PatientProfileResponse> => {
    const response = await apiClient.get<ApiResponse<PatientProfileResponse>>('/patient/profile');
    if (!response.data.data) {
      throw new Error(response.data.message || 'Failed to fetch patient profile');
    }
    return response.data.data;
  },

  updateProfile: async (data: UpdatePatientProfileData): Promise<PatientProfileResponse> => {
    const response = await apiClient.put<ApiResponse<PatientProfileResponse>>('/patient/profile', data);
    if (!response.data.data) {
      throw new Error(response.data.message || 'Failed to update profile');
    }
    return response.data.data;
  },

  changePassword: async (data: ChangePasswordData): Promise<{ success: boolean }> => {
    const response = await apiClient.put<ApiResponse<{ success: boolean }>>(
      '/patient/change-password',
      data
    );
    return response.data.data || { success: true };
  },
};
