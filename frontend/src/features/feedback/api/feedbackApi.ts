import apiClient, { ApiResponse } from '@/lib/axios';
import {
  CreateFeedbackData,
  FeedbackSummaryResponse,
  AdminFeedbackListResponse,
  FeedbackItem,
} from '../types/feedback.types';

export const feedbackApi = {
  create: async (appointmentId: number, data: CreateFeedbackData): Promise<FeedbackItem> => {
    const response = await apiClient.post<ApiResponse<FeedbackItem>>(
      `/appointments/${appointmentId}/feedback`,
      data
    );
    if (!response.data.data) {
      throw new Error(response.data.message || 'Failed to submit feedback');
    }
    return response.data.data;
  },

  getDoctorFeedback: async (
    doctorId: number,
    page: number = 1,
    limit: number = 10
  ): Promise<FeedbackSummaryResponse> => {
    const response = await apiClient.get<ApiResponse<FeedbackSummaryResponse>>(
      `/doctors/${doctorId}/feedback`,
      { params: { page, limit } }
    );
    return (
      response.data.data || {
        ratingAvg: 0,
        ratingCount: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        items: [],
        page: 1,
        limit,
        total: 0,
        totalPages: 0,
      }
    );
  },

  getDoctorOwnFeedback: async (
    page: number = 1,
    limit: number = 10
  ): Promise<FeedbackSummaryResponse> => {
    const response = await apiClient.get<ApiResponse<FeedbackSummaryResponse>>(
      '/doctor/feedback',
      { params: { page, limit } }
    );
    return (
      response.data.data || {
        ratingAvg: 0,
        ratingCount: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        items: [],
        page: 1,
        limit,
        total: 0,
        totalPages: 0,
      }
    );
  },

  getAdminFeedback: async (params?: {
    doctorId?: number;
    rating?: number;
    page?: number;
    limit?: number;
  }): Promise<AdminFeedbackListResponse> => {
    const response = await apiClient.get<ApiResponse<AdminFeedbackListResponse>>(
      '/admin/feedback',
      { params }
    );
    return (
      response.data.data || {
        items: [],
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
      }
    );
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/admin/feedback/${id}`);
  },
};
