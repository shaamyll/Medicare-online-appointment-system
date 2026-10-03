import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className,
  variant = 'default',
  size = 'sm',
  ...props
}) => {
  const variants = {
    default: 'bg-slate-100 text-slate-700',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border border-rose-200',
    info: 'bg-sky-50 text-sky-700 border border-sky-200',
    outline: 'border border-slate-300 text-slate-700',
  };

  const sizes = {
    sm: 'text-xs px-2.5 py-0.5 rounded-full font-medium',
    md: 'text-sm px-3 py-1 rounded-full font-medium',
  };

  return (
    <span className={cn('inline-flex items-center', variants[variant], sizes[size], className)} {...props}>
      {children}
    </span>
  );
};

export interface StatusBadgeProps {
  status: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const norm = (status || '').toLowerCase();

  let dotColor = 'bg-slate-400';
  let badgeClasses = 'bg-slate-50 text-slate-700 border-slate-200';
  let label = status;

  if (norm === 'active' || norm === 'approved' || norm === 'completed') {
    dotColor = 'bg-emerald-500';
    badgeClasses = 'bg-emerald-50/90 text-emerald-800 border-emerald-200';
    label = norm === 'active' ? 'Active' : norm === 'approved' ? 'Approved' : 'Completed';
  } else if (norm === 'inactive') {
    dotColor = 'bg-amber-500';
    badgeClasses = 'bg-amber-50/90 text-amber-800 border-amber-200';
    label = 'Inactive';
  } else if (norm === 'pending') {
    dotColor = 'bg-sky-500';
    badgeClasses = 'bg-sky-50/90 text-sky-800 border-sky-200';
    label = 'Pending';
  } else if (norm === 'rejected' || norm === 'cancelled') {
    dotColor = 'bg-rose-500';
    badgeClasses = 'bg-rose-50/90 text-rose-800 border-rose-200';
    label = norm === 'rejected' ? 'Rejected' : 'Cancelled';
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border shadow-2xs capitalize select-none',
        badgeClasses,
        className
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotColor)} />
      {label}
    </span>
  );
};

