import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'success';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      leftIcon,
      rightIcon,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center gap-2 whitespace-nowrap leading-none font-medium rounded-lg transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer';

    const variants = {
      primary:
        'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-xs focus-visible:ring-emerald-500',
      secondary:
        'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900 active:bg-gray-100 shadow-2xs focus-visible:ring-gray-300',
      outline:
        'border border-gray-300 bg-transparent text-gray-700 hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200 focus-visible:ring-gray-300',
      danger:
        'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-xs focus-visible:ring-rose-500',
      success:
        'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-xs focus-visible:ring-emerald-500',
      ghost:
        'text-gray-600 hover:text-gray-900 hover:bg-gray-100 active:bg-gray-200 focus-visible:ring-gray-300',
    };

    const sizes = {
      sm: 'h-8 px-3 text-xs gap-1.5 [&>svg]:h-4 [&>svg]:w-4 [&>svg]:shrink-0',
      md: 'h-10 px-4 text-sm gap-2 [&>svg]:h-4 [&>svg]:w-4 [&>svg]:shrink-0',
      lg: 'h-11 px-5 text-sm gap-2.5 [&>svg]:h-5 [&>svg]:w-5 [&>svg]:shrink-0',
    };

    const iconSize = size === 'lg' ? 'h-5 w-5' : 'h-4 w-4';

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        {...props}
      >
        {isLoading ? (
          <Loader2 className={cn('animate-spin shrink-0 text-current', iconSize)} />
        ) : (
          leftIcon && <span className="inline-flex shrink-0 items-center">{leftIcon}</span>
        )}
        <span className="inline-block leading-none">{children}</span>
        {!isLoading && rightIcon && (
          <span className="inline-flex shrink-0 items-center">{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  'aria-label': string;
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'success';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      icon,
      className,
      variant = 'ghost',
      size = 'md',
      isLoading = false,
      disabled,
      'aria-label': ariaLabel,
      title,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center shrink-0 rounded-lg transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer';

    const variants = {
      primary:
        'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-xs focus-visible:ring-emerald-500',
      secondary:
        'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900 active:bg-gray-100 shadow-2xs focus-visible:ring-gray-300',
      outline:
        'border border-gray-300 bg-transparent text-gray-700 hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200 focus-visible:ring-gray-300',
      danger:
        'bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-600 hover:text-white focus-visible:ring-rose-500',
      success:
        'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-600 hover:text-white focus-visible:ring-emerald-500',
      ghost:
        'text-gray-600 hover:text-gray-900 hover:bg-gray-100 active:bg-gray-200 focus-visible:ring-gray-300',
    };

    const sizes = {
      sm: 'h-8 w-8 text-xs [&>svg]:h-4 [&>svg]:w-4 [&>svg]:shrink-0',
      md: 'h-9 w-9 text-sm [&>svg]:h-4 [&>svg]:w-4 [&>svg]:shrink-0',
      lg: 'h-10 w-10 text-base [&>svg]:h-5 [&>svg]:w-5 [&>svg]:shrink-0',
    };

    return (
      <button
        ref={ref}
        type="button"
        aria-label={ariaLabel}
        title={title}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        {...props}
      >
        {isLoading ? (
          <Loader2 className={cn('animate-spin shrink-0 text-current', size === 'lg' ? 'h-5 w-5' : 'h-4 w-4')} />
        ) : (
          icon
        )}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';
