import apiClient, { ApiResponse } from '@/lib/axios';
import { Appointment, BookAppointmentData } from '../types/appointment.types';

export const appointmentsApi = {
  getAll: async (): Promise<Appointment[]> => {
    const response = await apiClient.get<ApiResponse<Appointment[]>>('/appointments');
    return response.data.data || [];
  },

  book: async (data: BookAppointmentData): Promise<Appointment> => {
    const response = await apiClient.post<ApiResponse<Appointment>>('/appointments', data);
    if (!response.data.data) {
      throw new Error(response.data.message || 'Failed to book appointment');
    }
    return response.data.data;
  },

  cancel: async (id: number): Promise<void> => {
    await apiClient.post(`/appointments/${id}/cancel`);
  },
};
