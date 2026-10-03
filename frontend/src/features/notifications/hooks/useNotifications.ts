import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { socketClient } from '@/lib/socket';
import { notificationsApi } from '../api/notificationsApi';
import { NotificationListResponse } from '../types/notification.types';

export function useUnreadCount() {
  const queryClient = useQueryClient();
  const [isSocketConnected, setIsSocketConnected] = useState<boolean>(socketClient.isConnected());

  useEffect(() => {
    let wasConnected = socketClient.isConnected();
    const unsubscribe = socketClient.onStatusChange((connected) => {
      setIsSocketConnected(connected);
      // When transitioning from disconnected to connected, refetch once
      if (!wasConnected && connected) {
        queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount });
        queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
      }
      wasConnected = connected;
    });
    return unsubscribe;
  }, [queryClient]);

  return useQuery({
    queryKey: queryKeys.notifications.unreadCount,
    queryFn: () => notificationsApi.getUnreadCount(),
    // Fallback: poll every 30s only when the WebSocket is disconnected
    refetchInterval: isSocketConnected ? false : 30000,
    staleTime: 1000 * 60,
  });
}

export function useNotifications(page = 1, filter: 'all' | 'unread' = 'all') {
  return useQuery({
    queryKey: queryKeys.notifications.list(page, filter),
    queryFn: () => notificationsApi.list(page, 10, filter),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 30,
  });
}

export function useMarkRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => notificationsApi.markRead(id),
    onMutate: async (id: number) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.unreadCount });
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.all });

      const prevCount = queryClient.getQueryData<number>(queryKeys.notifications.unreadCount);

      // Optimistically decrement count
      queryClient.setQueryData<number>(queryKeys.notifications.unreadCount, (old) => {
        return typeof old === 'number' ? Math.max(0, old - 1) : 0;
      });

      // Optimistically mark item as read in list queries
      queryClient.setQueriesData<NotificationListResponse>(
        { queryKey: queryKeys.notifications.all },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.map((item) =>
              item.id === id ? { ...item, isRead: true, readAt: new Date().toISOString() } : item
            ),
          };
        }
      );

      return { prevCount };
    },
    onError: (_err, _id, context) => {
      if (context?.prevCount !== undefined) {
        queryClient.setQueryData(queryKeys.notifications.unreadCount, context.prevCount);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

export function useMarkAllRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.unreadCount });
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.all });

      const prevCount = queryClient.getQueryData<number>(queryKeys.notifications.unreadCount);

      // Optimistically set count to 0
      queryClient.setQueryData<number>(queryKeys.notifications.unreadCount, 0);

      // Optimistically update all items to read
      queryClient.setQueriesData<NotificationListResponse>(
        { queryKey: queryKeys.notifications.all },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            unreadCount: 0,
            items: old.items.map((item) => ({
              ...item,
              isRead: true,
              readAt: item.readAt || new Date().toISOString(),
            })),
          };
        }
      );

      return { prevCount };
    },
    onError: (_err, _vars, context) => {
      if (context?.prevCount !== undefined) {
        queryClient.setQueryData(queryKeys.notifications.unreadCount, context.prevCount);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => notificationsApi.delete(id),
    onMutate: async (id: number) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.all });
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.unreadCount });

      const prevCount = queryClient.getQueryData<number>(queryKeys.notifications.unreadCount);

      // Optimistically remove from list
      queryClient.setQueriesData<NotificationListResponse>(
        { queryKey: queryKeys.notifications.all },
        (old) => {
          if (!old) return old;
          const target = old.items.find((i) => i.id === id);
          if (target && !target.isRead) {
            queryClient.setQueryData<number>(queryKeys.notifications.unreadCount, (c) =>
              typeof c === 'number' ? Math.max(0, c - 1) : 0
            );
          }
          return {
            ...old,
            total: Math.max(0, old.total - 1),
            items: old.items.filter((item) => item.id !== id),
          };
        }
      );

      return { prevCount };
    },
    onError: (_err, _id, context) => {
      if (context?.prevCount !== undefined) {
        queryClient.setQueryData(queryKeys.notifications.unreadCount, context.prevCount);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

export function useClearRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationsApi.clearRead(),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}
