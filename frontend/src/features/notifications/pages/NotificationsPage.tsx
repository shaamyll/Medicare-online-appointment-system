import React, { useState } from 'react';
import {
  Bell,
  CheckCheck,
  Trash2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
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

  const handleTabChange = (newFilter: 'all' | 'unread') => {
    setFilter(newFilter);
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

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center justify-center shadow-sm">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Notifications</h1>
              <p className="text-sm text-slate-500">
                View and manage your real-time alerts and activity updates
              </p>
            </div>
          </div>
        </div>

        {/* Global Actions */}
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllRead}
              disabled={markAllReadMutation.isPending}
              className="gap-1.5 text-xs text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Mark all as read</span>
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleClearRead}
            disabled={clearReadMutation.isPending}
            className="gap-1.5 text-xs text-slate-600 hover:text-rose-600 hover:bg-rose-50"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear read</span>
          </Button>
        </div>
      </div>

      {/* Filter Tabs & Stats Bar */}
      <Card className="border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleTabChange('all')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                filter === 'all'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              All
              <span className="ml-1.5 opacity-80">({filter === 'all' ? total : ''})</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('unread')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                filter === 'unread'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <span>Unread</span>
              {unreadCount > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    filter === 'unread' ? 'bg-white text-emerald-700' : 'bg-rose-600 text-white'
                  }`}
                >
                  {unreadCount}
                </span>
              )}
            </button>
          </div>

          <div className="text-xs text-slate-400 font-medium">
            {total > 0 && (
              <span>
                Page {page} of {totalPages} ({total} total)
              </span>
            )}
          </div>
        </div>

        {/* Content Body */}
        <CardContent className="p-0">
          {isLoading && !isPlaceholderData ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex gap-4 p-4 rounded-xl bg-slate-50/60 animate-pulse">
                  <div className="w-10 h-10 rounded-xl bg-slate-200 flex-shrink-0" />
                  <div className="flex-1 space-y-2.5">
                    <div className="h-4 bg-slate-200 rounded w-1/3" />
                    <div className="h-3.5 bg-slate-200 rounded w-4/5" />
                    <div className="h-3 bg-slate-200 rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">Failed to load notifications</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {(error as any)?.message || 'An error occurred while communicating with the notification server.'}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                className="mt-4 gap-1.5"
              >
                Try Again
              </Button>
            </div>
          ) : items.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center mx-auto mb-3 shadow-sm">
                <Bell className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-800">You're all caught up!</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {filter === 'unread'
                  ? 'There are no unread notifications waiting for your attention.'
                  : 'You have no notifications in your history yet.'}
              </p>
            </div>
          ) : (
            <div className={`divide-y divide-slate-100 ${isPlaceholderData ? 'opacity-60 transition-opacity' : ''}`}>
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

          {/* Server-Side Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-5 py-4 border-t border-slate-100 bg-slate-50/50">
              <div className="text-xs text-slate-500">
                Showing{' '}
                <span className="font-semibold text-slate-700">
                  {Math.min(total, (page - 1) * 10 + 1)}
                </span>{' '}
                to{' '}
                <span className="font-semibold text-slate-700">
                  {Math.min(total, page * 10)}
                </span>{' '}
                of <span className="font-semibold text-slate-700">{total}</span> notifications
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={page === 1 || isPlaceholderData}
                  className="gap-1 text-xs px-2.5 h-8"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Prev</span>
                </Button>

                {/* Page numbers */}
                <div className="flex items-center gap-1 mx-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                    // Show current page, first, last, and immediate neighbors
                    if (
                      p === 1 ||
                      p === totalPages ||
                      (p >= page - 1 && p <= page + 1)
                    ) {
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPage(p)}
                          disabled={isPlaceholderData}
                          className={`w-8 h-8 rounded-lg text-xs font-semibold transition ${
                            p === page
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'text-slate-600 hover:bg-slate-200/70'
                          }`}
                        >
                          {p}
                        </button>
                      );
                    }
                    if (p === page - 2 || p === page + 2) {
                      return (
                        <span key={p} className="text-xs text-slate-400 px-0.5">
                          ...
                        </span>
                      );
                    }
                    return null;
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={page >= totalPages || isPlaceholderData}
                  className="gap-1 text-xs px-2.5 h-8"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
