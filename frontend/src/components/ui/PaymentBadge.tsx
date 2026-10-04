import React from 'react';
import { Clock, CheckCircle2, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PaymentStatus } from '@/features/payments/types/payment.types';

export interface PaymentBadgeProps {
  status?: PaymentStatus | string | null;
  label?: string;
  className?: string;
  size?: 'sm' | 'md';
}

export const PaymentBadge: React.FC<PaymentBadgeProps> = ({
  status = 'unpaid',
  label: customLabel,
  className,
  size = 'sm',
}) => {
  const norm = (status || 'unpaid').toLowerCase();

  let badgeStyle = 'bg-amber-50 text-amber-700 border-amber-200';
  let Icon = Clock;
  let label = customLabel || 'Unpaid';

  switch (norm) {
    case 'paid':
      badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      Icon = CheckCircle2;
      label = customLabel || 'Paid';
      break;

    case 'refunded':
      badgeStyle = 'bg-slate-100 text-slate-600 border-slate-200';
      Icon = RotateCcw;
      label = customLabel || 'Refunded';
      break;

    case 'awaiting_approval':
    case 'awaiting approval':
      badgeStyle = 'bg-slate-100 text-slate-600 border-slate-200';
      Icon = Clock;
      label = customLabel || 'Awaiting approval';
      break;

    case 'unpaid':
    case 'payable':
    default:
      badgeStyle = 'bg-amber-50 text-amber-700 border-amber-200';
      Icon = Clock;
      label = customLabel || 'Unpaid';
      break;
  }

  const iconSizes = size === 'md' ? 'w-3.5 h-3.5' : 'w-3 h-3';
  const badgePadding = size === 'md' ? 'px-3 py-1 text-xs' : 'px-2.5 py-0.5 text-xs';

  return (
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
  );
};
