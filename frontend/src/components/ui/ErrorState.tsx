import React from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'An unexpected error occurred while loading data. Please try again.',
  onRetry,
  className,
}) => {
  return (
    <div className={cn('flex flex-col items-center justify-center p-8 text-center rounded-xl border border-rose-200 bg-rose-50/50', className)}>
      <div className="rounded-full bg-rose-100 p-3 mb-3 text-rose-600">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h4 className="text-base font-semibold text-rose-950 mb-1">{title}</h4>
      <p className="text-sm text-rose-700 max-w-sm mb-4">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" size="sm" className="border-rose-300 text-rose-800 hover:bg-rose-100">
          Try Again
        </Button>
      )}
    </div>
  );
};
