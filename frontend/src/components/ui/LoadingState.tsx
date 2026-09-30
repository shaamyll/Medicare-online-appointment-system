import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface LoadingStateProps {
  message?: string;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading Medi-Care data...',
  className,
}) => {
  return (
    <div className={cn('flex flex-col items-center justify-center p-12 text-center', className)}>
      <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-3" />
      <p className="text-sm font-medium text-slate-600">{message}</p>
    </div>
  );
};
