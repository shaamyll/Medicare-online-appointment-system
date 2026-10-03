import React, { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { socketClient } from '@/lib/socket';
import { queryKeys } from '@/lib/queryKeys';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { NotificationItemData, NotificationListResponse } from '@/features/notifications/types/notification.types';

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, logout } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Connect socket when authenticated with a valid token
  useEffect(() => {
    if (token) {
      socketClient.connect(token);
    } else {
      socketClient.disconnect();
    }
  }, [token]);

  // Subscribe to real-time events from server
  useEffect(() => {
    // 1. Notification Event
    const unsubNotification = socketClient.subscribe('notification', (msg: any) => {
      const notification: NotificationItemData = msg.data;
      const unreadCount: number | undefined = msg.unreadCount;

      // Update unread count in cache
      if (typeof unreadCount === 'number') {
        queryClient.setQueryData(queryKeys.notifications.unreadCount, unreadCount);
      } else {
        queryClient.setQueryData<number>(queryKeys.notifications.unreadCount, (old) => (old ?? 0) + 1);
      }

      // Prepend to cached first page of notifications
      queryClient.setQueriesData<NotificationListResponse>(
        { queryKey: queryKeys.notifications.all },
        (old) => {
          if (!old) return old;
          if (old.items.some((i) => i.id === notification.id)) return old;
          return {
            ...old,
            total: old.total + 1,
            unreadCount: (old.unreadCount ?? 0) + 1,
            items: [notification, ...old.items],
          };
        }
      );

      // Invalidate the notifications list queries
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });

      // Toast with clickable title + message that navigates to notification link
      toast(notification.message, 'info', {
        title: notification.title,
        onClick: () => {
          if (notification.link) {
            navigate(notification.link);
          }
        },
      });
    });

    // 2. Data Changed Event
    const unsubDataChanged = socketClient.subscribe('data_changed', (msg: any) => {
      const keys: string[] = msg.data?.queryKeys || [];
      keys.forEach((keyGroup) => {
        if (keyGroup === 'appointments') {
          queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all });
        } else if (keyGroup === 'doctors') {
          queryClient.invalidateQueries({ queryKey: queryKeys.doctors.all });
          queryClient.invalidateQueries({ queryKey: queryKeys.admin.doctors() });
        } else if (keyGroup === 'admin-stats') {
          queryClient.invalidateQueries({ queryKey: queryKeys.admin.stats });
        } else if (keyGroup === 'doctor-requests') {
          queryClient.invalidateQueries({ queryKey: queryKeys.admin.doctorRequests });
        } else if (keyGroup === 'patients') {
          queryClient.invalidateQueries({ queryKey: queryKeys.admin.patients });
        } else {
          queryClient.invalidateQueries({ queryKey: [keyGroup] });
        }
      });
    });

    // 3. Force Logout Event
    const unsubForceLogout = socketClient.subscribe('force_logout', (msg: any) => {
      const reason = msg.data?.reason || 'Your session has ended.';
      toast(reason, 'error');
      logout(true);
    });

    return () => {
      unsubNotification();
      unsubDataChanged();
      unsubForceLogout();
    };
  }, [queryClient, toast, navigate, logout]);

  return <>{children}</>;
};
