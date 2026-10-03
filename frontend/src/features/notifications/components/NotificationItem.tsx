import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { NotificationItemData } from '../types/notification.types';
import { getNotificationMeta } from '../utils/notificationMeta';
import { formatRelativeTime, formatFullDateTime } from '@/lib/date';
import { IconButton } from '@/components/ui/IconButton';
import { cn } from '@/lib/utils';

interface NotificationItemProps {
  notification: NotificationItemData;
  onMarkRead?: (id: number) => void;
  onDelete?: (id: number) => void;
  compact?: boolean;
  onCloseDropdown?: () => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkRead,
  onDelete,
  compact = false,
  onCloseDropdown,
}) => {
  const navigate = useNavigate();
  const meta = getNotificationMeta(notification.type);
  const IconComponent = meta.icon;

  const handleClick = (e: React.MouseEvent) => {
    // If click was on delete button, do not navigate
    if ((e.target as HTMLElement).closest('.notif-delete-btn')) {
      return;
    }

    if (!notification.isRead && onMarkRead) {
      onMarkRead(notification.id);
    }

    if (onCloseDropdown) {
      onCloseDropdown();
    }

    const targetLink = notification.link || meta.defaultLink;
    if (targetLink) {
      navigate(targetLink);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(notification.id);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        'group relative flex items-start gap-3.5 transition-colors cursor-pointer border-b border-gray-100 last:border-b-0',
        compact ? 'p-3' : 'p-4 sm:p-5',
        !notification.isRead
          ? 'bg-emerald-50/40 hover:bg-emerald-50/60'
          : 'bg-white hover:bg-gray-50'
      )}
    >
      {/* Category Icon - Fixed-size circular icon */}
      <div
        className={cn(
          'shrink-0 flex items-center justify-center rounded-full border shadow-2xs',
          compact ? 'w-8 h-8' : 'w-10 h-10',
          meta.iconBg,
          meta.iconColor
        )}
      >
        <IconComponent className={compact ? 'h-4 w-4' : 'h-5 w-5'} />
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0 pr-7">
        <div className="flex items-center gap-2">
          <h4
            className={cn(
              'font-semibold truncate text-gray-900',
              compact ? 'text-xs' : 'text-sm'
            )}
          >
            {notification.title}
          </h4>
          {!notification.isRead && (
            <span
              className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"
              title="Unread"
            />
          )}
        </div>

        <p
          className={cn(
            'text-gray-600 mt-0.5 line-clamp-2 leading-relaxed',
            compact ? 'text-[11px]' : 'text-xs sm:text-sm'
          )}
        >
          {notification.message}
        </p>

        <span
          className={cn(
            'inline-block text-gray-400 mt-1 cursor-default',
            compact ? 'text-[10px]' : 'text-xs'
          )}
          title={formatFullDateTime(notification.createdAt)}
        >
          {formatRelativeTime(notification.createdAt)}
        </span>
      </div>

      {/* Delete button on hover / action */}
      {onDelete && (
        <div className="notif-delete-btn absolute top-3 right-3 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          <IconButton
            icon={<Trash2 className="h-3.5 w-3.5" />}
            aria-label="Delete notification"
            title="Delete notification"
            size="sm"
            variant="ghost"
            onClick={handleDelete}
            className="h-7 w-7 text-gray-400 hover:text-rose-600 hover:bg-rose-50"
          />
        </div>
      )}
    </div>
  );
};
