import React, { useState } from 'react';
import {
  CheckCheck,
  Trash2,
  AlertCircle,
  Bell,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { SegmentedTabs } from '@/components/ui/SegmentedTabs';
import { TablePagination } from '@/components/ui/Table';
import {
  useNotifications,
  useUnreadCount,
  useMarkRead,
  useMarkAllRead,
  useDeleteNotification,
  useClearRead,
} from '../hooks/useNotifications';
import { NotificationItem } from '../components/NotificationItem';

export const NotificationsPage: React.FC = () => {
  const [page, setPage] = useState<number>(1);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const { data, isLoading, isError, error, refetch, isPlaceholderData } = useNotifications(page, filter);
  const { data: unreadCount = 0 } = useUnreadCount();

  const markReadMutation = useMarkRead();
  const markAllReadMutation = useMarkAllRead();
  const deleteMutation = useDeleteNotification();
  const clearReadMutation = useClearRead();

  const items = data?.items || [];
  const total = data?.total || 0;
  const totalPages = Math.max(1, data?.totalPages || 1);

  const handleTabChange = (newFilter: string) => {
    setFilter(newFilter as 'all' | 'unread');
    setPage(1);
  };

  const handleMarkAllRead = () => {
    markAllReadMutation.mutate();
  };

  const handleClearRead = () => {
    if (window.confirm('Are you sure you want to remove all read notifications?')) {
      clearReadMutation.mutate();
    }
  };

  const tabs = [
    { id: 'all', label: 'All Notifications', count: total },
    { id: 'unread', label: 'Unread', count: unreadCount },
  ];

  return (
    <div className="w-full mx-auto space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Notifications"
        subtitle="View and manage your real-time alerts and activity updates"
        actions={
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleMarkAllRead}
                disabled={markAllReadMutation.isPending}
                leftIcon={<CheckCheck className="h-4 w-4 text-emerald-600" />}
              >
                Mark all as read
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleClearRead}
              disabled={clearReadMutation.isPending}
              className="text-gray-600 hover:text-rose-600 hover:bg-rose-50 border-gray-200"
              leftIcon={<Trash2 className="h-4 w-4" />}
            >
              Clear read
            </Button>
          </div>
        }
      />

      {/* Tabs */}
      <div>
        <SegmentedTabs
          tabs={tabs}
          activeTab={filter}
          onChange={handleTabChange}
        />
      </div>

      {/* Notification Card Container */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {isLoading && !isPlaceholderData ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-4 p-4 rounded-xl bg-gray-50/60 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0" />
                <div className="flex-1 space-y-2.5">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-3.5 bg-gray-200 rounded w-4/5" />
                  <div className="h-3 bg-gray-200 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="p-12 text-center bg-white">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-gray-900">Failed to load notifications</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto leading-relaxed">
              {(error as any)?.message || 'An error occurred while communicating with the notification server.'}
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => refetch()}
              className="mt-4"
              leftIcon={<RotateCcw className="h-4 w-4" />}
            >
              Try Again
            </Button>
          </div>
        ) : items.length === 0 ? (
          <div className="p-16 text-center bg-white">
            <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-3">
              <Bell className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-gray-900">You're all caught up!</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto leading-relaxed">
              {filter === 'unread'
                ? 'There are no unread notifications waiting for your attention.'
                : 'You have no notifications in your history yet.'}
            </p>
          </div>
        ) : (
          <div className={`divide-y divide-gray-100 ${isPlaceholderData ? 'opacity-60 transition-opacity' : ''}`}>
            {items.map((item) => (
              <NotificationItem
                key={item.id}
                notification={item}
                onMarkRead={(id) => markReadMutation.mutate(id)}
                onDelete={(id) => deleteMutation.mutate(id)}
              />
            ))}
          </div>
        )}

        {/* Server-Side Pagination Bar on bg-gray-50 */}
        {totalPages > 1 && (
          <TablePagination
            page={page}
            totalPages={totalPages}
            totalItems={total}
            pageSize={10}
            onPageChange={(newPage) => setPage(newPage)}
          />
        )}
      </div>
    </div>
  );
};
