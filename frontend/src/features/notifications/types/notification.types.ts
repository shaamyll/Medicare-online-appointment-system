export interface NotificationItemData {
  id: number;
  userId: number;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any> | null;
  link?: string | null;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
}

export interface NotificationListResponse {
  items: NotificationItemData[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  unreadCount: number;
}

export interface UnreadCountResponse {
  unreadCount: number;
}
