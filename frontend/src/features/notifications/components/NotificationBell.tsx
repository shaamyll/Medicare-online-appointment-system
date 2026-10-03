import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCheck, ExternalLink } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import {
  useUnreadCount,
  useNotifications,
  useMarkRead,
  useMarkAllRead,
} from '../hooks/useNotifications';
import { NotificationItem } from './NotificationItem';
import { IconButton } from '@/components/ui/IconButton';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export const NotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const { data: unreadCount = 0 } = useUnreadCount();
  const { data: notificationsData, isLoading } = useNotifications(1, 'all');
  const markReadMutation = useMarkRead();
  const markAllReadMutation = useMarkAllRead();

  // Role-based target notifications route
  const notificationsRoute =
    user?.role === 'admin'
      ? '/admin/notifications'
      : user?.role === 'doctor'
      ? '/doctor/notifications'
      : '/dashboard/notifications';

  // Close dropdown on click outside or Escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const items = notificationsData?.items?.slice(0, 5) || [];

  const handleMarkAllRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    markAllReadMutation.mutate();
  };

  const handleMarkRead = (id: number) => {
    markReadMutation.mutate(id);
  };

  const isAdmin = user?.role === 'admin';

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Bell Button: IconButton with exactly centered icon & count badge */}
      <div className="relative inline-block">
        <IconButton
          icon={<Bell className="h-4 w-4" />}
          aria-label="Notifications"
          title="Notifications"
          size="sm"
          variant={isAdmin ? 'ghost' : 'secondary'}
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'h-9 w-9 rounded-md border shadow-2xs transition-colors',
            isAdmin
              ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700/80'
              : 'bg-white border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          )}
        />

        {/* Count badge positioned absolute -top-1 -right-1 */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-rose-600 rounded-full ring-2 ring-white shadow-xs pointer-events-none leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] rounded-xl bg-white border border-gray-200 shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 origin-top-right">
          {/* Header Row: Title left, "Mark all as read" ghost button right, vertically centered, bg-gray-50, border-b */}
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-semibold text-rose-700 bg-rose-100 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleMarkAllRead}
                disabled={markAllReadMutation.isPending}
                leftIcon={<CheckCheck className="h-4 w-4" />}
                className="h-7 px-2 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50/60"
              >
                
                <span>Mark all as read</span>
              </Button>
            )}
          </div>

          {/* Notifications List (Latest 5) */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-gray-100">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="w-8 h-8 rounded-full bg-gray-100 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 bg-gray-100 rounded w-3/4" />
                      <div className="h-3 bg-gray-100 rounded w-5/6" />
                    </div>
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="p-8 text-center bg-white">
                <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-2">
                  <Bell className="h-5 w-5" />
                </div>
                <p className="text-xs font-semibold text-gray-700">You're all caught up!</p>
                <p className="text-[11px] text-gray-400 mt-0.5">No recent notifications</p>
              </div>
            ) : (
              items.map((item) => (
                <NotificationItem
                  key={item.id}
                  notification={item}
                  compact
                  onMarkRead={handleMarkRead}
                  onCloseDropdown={() => setIsOpen(false)}
                />
              ))
            )}
          </div>

          {/* Footer: "View all notifications" row on bg-gray-50, centered */}
          <div className="p-2.5 bg-gray-50 border-t border-gray-200 text-center">
            <Link
              to={notificationsRoute}
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition py-1.5 px-3 rounded-lg hover:bg-emerald-50/60 w-full"
            >
              <span>View all notifications</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
