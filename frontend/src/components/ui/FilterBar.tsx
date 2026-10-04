import React from 'react';
import { cn } from '@/lib/utils';

export interface FilterBarProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  children,
  actions,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        'flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white border border-gray-200 rounded-xl p-3.5 mb-6 shadow-sm',
        className
      )}
      {...props}
    >
      <div className="flex flex-1 flex-wrap items-center gap-3 w-full">
        {children}
      </div>

      {actions && (
        <div className="flex flex-wrap items-center gap-2.5 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-gray-200">
          {actions}
        </div>
      )}
    </div>
  );
};
