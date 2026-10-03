import React from 'react';
import {
  Clock,
  CheckCircle2,
  CheckCheck,
  XCircle,
  Ban,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StatusBadgeProps {
  status: string;
  className?: string;
  showHelper?: boolean;
  rejectionReason?: string | null;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  className,
  showHelper = false,
  rejectionReason,
  size = 'sm',
}) => {
  const norm = (status || '').toLowerCase();

  let badgeStyle = 'bg-slate-100 text-slate-700 border-slate-300';
  let Icon = Clock;
  let label = status.toUpperCase();
  let helper: string | null = null;

  switch (norm) {
    case 'pending':
      badgeStyle = 'bg-amber-50 text-amber-800 border-amber-200';
      Icon = Clock;
      label = 'Pending';
      helper = 'Waiting for doctor confirmation';
      break;

    case 'approved':
    case 'confirmed':
      badgeStyle = 'bg-emerald-50 text-emerald-800 border-emerald-200';
      Icon = CheckCircle2;
      label = 'Approved';
      helper = 'Confirmed';
      break;

    case 'completed':
      badgeStyle = 'bg-sky-50 text-sky-800 border-sky-200';
      Icon = CheckCheck;
      label = 'Completed';
      helper = 'Consultation finished';
      break;

    case 'rejected':
      badgeStyle = 'bg-rose-50 text-rose-800 border-rose-200';
      Icon = XCircle;
      label = 'Rejected';
      helper = rejectionReason ? `Rejected: ${rejectionReason}` : 'Appointment declined';
      break;

    case 'cancelled':
      badgeStyle = 'bg-slate-100 text-slate-600 border-slate-200';
      Icon = Ban;
      label = 'Cancelled';
      helper = rejectionReason ? `Cancelled: ${rejectionReason}` : 'Appointment cancelled';
      break;

    case 'active':
      badgeStyle = 'bg-emerald-50 text-emerald-800 border-emerald-200';
      Icon = ShieldCheck;
      label = 'Active';
      break;

    case 'inactive':
      badgeStyle = 'bg-slate-100 text-slate-600 border-slate-200';
      Icon = AlertTriangle;
      label = 'Inactive';
      break;

    default:
      badgeStyle = 'bg-slate-100 text-slate-700 border-slate-200';
      Icon = Clock;
      label = status;
      break;
  }

  const iconSizes = size === 'md' ? 'w-3.5 h-3.5' : 'w-3 h-3';
  const badgePadding = size === 'md' ? 'px-3 py-1 text-xs' : 'px-2.5 py-0.5 text-xs';

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full font-semibold border shadow-2xs select-none tracking-wide',
          badgeStyle,
          badgePadding,
          className
        )}
      >
        <Icon className={cn('shrink-0', iconSizes)} />
        <span>{label}</span>
      </span>

      {showHelper && helper && (
        <span
          className={cn(
            'text-[11px] font-medium leading-tight max-w-xs',
            norm === 'rejected'
              ? 'text-rose-600 font-semibold'
              : norm === 'pending'
              ? 'text-amber-700'
              : norm === 'approved'
              ? 'text-emerald-700'
              : 'text-slate-500'
          )}
        >
          {helper}
        </span>
      )}
    </div>
  );
};
