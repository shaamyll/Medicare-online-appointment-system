import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'light' | 'dark';
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, variant = 'light', className, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className={cn('block text-sm font-medium mb-1.5', variant === 'dark' ? 'text-slate-300' : 'text-slate-700')}>
            {label}
          </label>
        )}
        <div className="relative rounded-lg shadow-sm">
          {leftIcon && (
            <div className={cn('absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none', variant === 'dark' ? 'text-slate-400' : 'text-slate-400')}>
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              'block w-full rounded-lg border px-3.5 py-2 text-sm transition-colors focus:outline-none focus:ring-1 disabled:opacity-60 disabled:cursor-not-allowed',
              variant === 'dark'
                ? 'border-slate-700 bg-slate-900/90 text-slate-100 placeholder-slate-500 focus:border-teal-500 focus:ring-teal-500 [color-scheme:dark] [&:-webkit-autofill]:[box-shadow:0_0_0_1000px_#0f172a_inset] [&:-webkit-autofill]:[-webkit-text-fill-color:#f1f5f9]'
                : 'border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:ring-emerald-500 disabled:bg-slate-50 disabled:text-slate-500',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              error && (variant === 'dark' ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500 text-rose-300' : 'border-rose-500 focus:border-rose-500 focus:ring-rose-500 text-rose-900'),
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400">
              {rightIcon}
            </div>
          )}
        </div>
        {error ? (
          <p className="mt-1.5 text-xs text-rose-600 font-medium">{error}</p>
        ) : helperText ? (
          <p className="mt-1.5 text-xs text-slate-500">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
