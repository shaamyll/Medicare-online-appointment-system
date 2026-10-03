import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { IconButton } from './IconButton';

export interface SearchInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  debounceMs?: number;
  isLoading?: boolean;
  onClear?: () => void;
  variant?: 'gray' | 'white';
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      value: controlledValue,
      defaultValue = '',
      onChange,
      debounceMs = 300,
      isLoading = false,
      onClear,
      placeholder = 'Search...',
      className,
      variant = 'gray',
      ...props
    },
    ref
  ) => {
    const isControlled = controlledValue !== undefined;
    const [innerValue, setInnerValue] = useState<string>(
      isControlled ? controlledValue : defaultValue
    );
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Sync controlled value changes
    useEffect(() => {
      if (isControlled && controlledValue !== innerValue) {
        setInnerValue(controlledValue);
      }
    }, [controlledValue, isControlled]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = e.target.value;
      setInnerValue(next);

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      if (onChange) {
        debounceTimerRef.current = setTimeout(() => {
          onChange(next);
        }, debounceMs);
      }
    };

    const handleClear = () => {
      setInnerValue('');
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      onChange?.('');
      onClear?.();
    };

    useEffect(() => {
      return () => {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
      };
    }, []);

    const hasValue = innerValue.length > 0;

    return (
      <div className={cn('relative w-full min-w-[200px]', className)}>
        {/* Left Search Icon */}
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none text-gray-400">
          <Search className="h-4 w-4 shrink-0" />
        </div>

        {/* Input Field */}
        <input
          ref={ref}
          type="text"
          value={innerValue}
          onChange={handleChange}
          placeholder={placeholder}
          className={cn(
            'h-10 w-full rounded-lg pl-11 pr-11 text-sm transition-colors duration-150',
            'border border-gray-200 text-gray-900 placeholder:text-gray-400',
            variant === 'gray' ? 'bg-gray-50 focus:bg-white' : 'bg-white',
            'focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20'
          )}
          {...props}
        />

        {/* Right Action: Loading Spinner or Clear Button */}
        <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center">
          {isLoading ? (
            <div className="p-1.5 text-gray-400">
              <Loader2 className="h-4 w-4 animate-spin shrink-0" />
            </div>
          ) : hasValue ? (
            <IconButton
              type="button"
              icon={<X className="h-3.5 w-3.5" />}
              aria-label="Clear search"
              title="Clear search"
              size="sm"
              variant="ghost"
              onClick={handleClear}
              className="h-7 w-7 text-gray-400 hover:text-gray-600 rounded-md"
            />
          ) : null}
        </div>
      </div>
    );
  }
);

SearchInput.displayName = 'SearchInput';
