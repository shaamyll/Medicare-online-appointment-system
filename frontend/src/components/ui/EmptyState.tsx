import React from 'react';
import { CalendarX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = <CalendarX className="h-8 w-8 text-gray-400" />,
  title,
  description,
  actionLabel,
  onAction,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-12 text-center rounded-xl border border-dashed border-gray-300 bg-gray-50/70',
        className
      )}
    >
      <div className="rounded-full bg-gray-100 p-3.5 mb-3 flex items-center justify-center">
        {icon}
      </div>
      <h4 className="text-base font-bold text-gray-900 mb-1 tracking-tight">{title}</h4>
      <p className="text-sm text-gray-500 max-w-sm mb-5 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} size="sm" variant="primary">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
