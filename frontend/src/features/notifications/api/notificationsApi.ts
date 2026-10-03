import apiClient, { ApiResponse } from '@/lib/axios';
import { NotificationListResponse, UnreadCountResponse } from '../types/notification.types';

export const notificationsApi = {
  list: async (page = 1, limit = 10, filter: 'all' | 'unread' = 'all'): Promise<NotificationListResponse> => {
    const response = await apiClient.get<ApiResponse<NotificationListResponse>>('/notifications', {
      params: { page, limit, filter },
    });
    return response.data.data || {
      items: [],
      page,
      limit,
      total: 0,
      totalPages: 1,
      unreadCount: 0,
    };
  },

  getUnreadCount: async (): Promise<number> => {
    const response = await apiClient.get<ApiResponse<UnreadCountResponse>>('/notifications/unread-count');
    return response.data.data?.unreadCount ?? 0;
  },

  markRead: async (id: number): Promise<void> => {
    await apiClient.patch(`/notifications/${id}/read`);
  },

  markAllRead: async (): Promise<void> => {
    await apiClient.post('/notifications/read-all');
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/notifications/${id}`);
  },

  clearRead: async (): Promise<void> => {
    await apiClient.delete('/notifications');
  },
};
