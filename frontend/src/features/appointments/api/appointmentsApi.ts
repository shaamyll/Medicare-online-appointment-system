import apiClient, { ApiResponse } from '@/lib/axios';
import { Appointment, BookAppointmentData, SlotsResponse } from '../types/appointment.types';

export const appointmentsApi = {
  getAll: async (params?: { status?: string; date?: string }): Promise<Appointment[]> => {
    const response = await apiClient.get<ApiResponse<Appointment[]>>('/appointments', { params });
    return response.data.data || [];
  },

  getSlots: async (doctorId: number, date: string): Promise<SlotsResponse> => {
    const response = await apiClient.get<ApiResponse<SlotsResponse>>('/appointments/slots', {
      params: { doctorId, date }
    });
    return response.data.data || { date, dayOfWeek: '', hasSchedule: false, slots: [] };
  },

  book: async (data: BookAppointmentData): Promise<Appointment> => {
    const response = await apiClient.post<ApiResponse<Appointment>>('/appointments', data);
    if (!response.data.data) {
      throw new Error(response.data.message || 'Failed to book appointment');
    }
    return response.data.data;
  },

  cancel: async (id: number): Promise<Appointment> => {
    const response = await apiClient.post<ApiResponse<Appointment>>(`/appointments/${id}/cancel`);
    return response.data.data!;
  },

  updateStatus: async (id: number, status: string): Promise<Appointment> => {
    const response = await apiClient.patch<ApiResponse<Appointment>>(`/appointments/${id}/status`, { status });
    return response.data.data!;
  },

  addConsultation: async (id: number, data: { diagnosis: string; prescription: string; consultationNotes: string }): Promise<Appointment> => {
    const response = await apiClient.post<ApiResponse<Appointment>>(`/appointments/${id}/consultation`, data);
    return response.data.data!;
  }
};
