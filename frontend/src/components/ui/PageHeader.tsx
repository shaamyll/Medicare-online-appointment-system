import React from 'react';
import { cn } from '@/lib/utils';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  badge,
  actions,
  className,
  children,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6',
        className
      )}
    >
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">{title}</h1>
          {badge}
        </div>
        {subtitle && <p className="text-sm text-gray-500 leading-relaxed">{subtitle}</p>}
        {children}
      </div>

      {actions && (
        <div className="flex flex-wrap items-center gap-2.5 shrink-0 sm:self-center">
          {actions}
        </div>
      )}
    </div>
  );
};
