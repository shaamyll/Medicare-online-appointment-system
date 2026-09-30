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
  icon = <CalendarX className="w-10 h-10 text-slate-400" />,
  title,
  description,
  actionLabel,
  onAction,
  className,
}) => {
  return (
    <div className={cn('flex flex-col items-center justify-center p-12 text-center rounded-xl border border-dashed border-slate-300 bg-slate-50/50', className)}>
      <div className="rounded-full bg-slate-100 p-4 mb-3">
        {icon}
      </div>
      <h4 className="text-base font-semibold text-slate-900 mb-1">{title}</h4>
      <p className="text-sm text-slate-500 max-w-sm mb-5">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} size="sm">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
