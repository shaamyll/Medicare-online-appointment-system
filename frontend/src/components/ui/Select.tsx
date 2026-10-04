import React, { useState, useRef, useEffect, useId } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectOption<T = string | number> {
  value: T;
  label: string;
  icon?: React.ReactNode;
  dot?: string; // e.g. "bg-amber-500", "bg-emerald-500", "bg-rose-500"
  disabled?: boolean;
}

export interface SelectProps<T = string | number> {
  value: T | undefined;
  onChange: (value: T) => void;
  options: SelectOption<T>[];
  placeholder?: string;
  leadingIcon?: React.ReactNode;
  searchable?: boolean;
  searchPlaceholder?: string;
  disabled?: boolean;
  error?: string;
  size?: 'sm' | 'md';
  variant?: 'light' | 'dark';
  className?: string;
  buttonClassName?: string;
  name?: string;
  id?: string;
  'aria-label'?: string;
}

export function Select<T extends string | number = string | number>({
  value,
  onChange,
  options,
  placeholder = 'Select an option...',
  leadingIcon,
  searchable = false,
  searchPlaceholder = 'Search options...',
  disabled = false,
  error,
  size = 'md',
  variant = 'light',
  className,
  buttonClassName,
  id,
  'aria-label': ariaLabel,
}: SelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [openUpward, setOpenUpward] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const generatedId = useId();
  const selectId = id || generatedId;

  // Selected option resolution
  const selectedOption = options.find((opt) => opt.value === value);

  // Filtered options based on search query
  const filteredOptions = searchable
    ? options.filter((opt) =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options;

  // Position detection (flips upward if no space below)
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      if (spaceBelow < 250 && spaceAbove > 250) {
        setOpenUpward(true);
      } else {
        setOpenUpward(false);
      }
      if (searchable) {
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
    } else {
      setSearchQuery('');
      setHighlightedIndex(-1);
    }
  }, [isOpen, searchable]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        triggerRef.current?.focus();
        break;
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => {
          const next = prev < filteredOptions.length - 1 ? prev + 1 : 0;
          return next;
        });
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => {
          const next = prev > 0 ? prev - 1 : filteredOptions.length - 1;
          return next;
        });
        break;
      case 'Home':
        e.preventDefault();
        setHighlightedIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setHighlightedIndex(filteredOptions.length - 1);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          const option = filteredOptions[highlightedIndex];
          if (!option.disabled) {
            onChange(option.value);
            setIsOpen(false);
            triggerRef.current?.focus();
          }
        }
        break;
      case 'Tab':
        setIsOpen(false);
        break;
    }
  };

  const handleSelect = (option: SelectOption<T>) => {
    if (option.disabled) return;
    onChange(option.value);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  const sizes = {
    sm: 'h-8 px-2.5 text-xs rounded-md',
    md: 'h-10 px-3 text-sm rounded-lg',
  };

  return (
    <div
      ref={containerRef}
      className={cn('relative inline-block w-full min-w-[140px]', className)}
      onKeyDown={handleKeyDown}
    >
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        id={selectId}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel || placeholder}
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center justify-between gap-2 border font-normal text-left transition-all duration-150 select-none cursor-pointer',
          sizes[size],
          variant === 'dark'
            ? 'bg-slate-900 border-slate-700 text-slate-100 hover:border-slate-500 focus:ring-teal-500/20 focus:border-teal-500'
            : 'bg-white border-gray-200 hover:border-gray-300 text-gray-900 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-2xs',
          error
            ? variant === 'dark'
              ? 'border-rose-500 text-rose-300 focus:border-rose-500'
              : 'border-rose-400 focus:ring-rose-500/20 text-rose-900'
            : '',
          'focus:outline-none focus:ring-2',
          disabled && (variant === 'dark' ? 'opacity-60 cursor-not-allowed bg-slate-800' : 'opacity-60 cursor-not-allowed bg-gray-50'),
          buttonClassName
        )}
      >
        <span className="flex items-center gap-2 truncate">
          {leadingIcon && (
            <span className={cn('shrink-0 [&>svg]:h-4 [&>svg]:w-4', variant === 'dark' ? 'text-slate-400' : 'text-gray-400')}>
              {leadingIcon}
            </span>
          )}
          {selectedOption ? (
            <span className={cn('flex items-center gap-2 truncate font-medium', variant === 'dark' ? 'text-slate-100' : 'text-gray-900')}>
              {selectedOption.dot && (
                <span className={cn('h-2 w-2 rounded-full shrink-0', selectedOption.dot)} />
              )}
              {selectedOption.icon && (
                <span className={cn('shrink-0 [&>svg]:h-4 [&>svg]:w-4', variant === 'dark' ? 'text-slate-400' : 'text-gray-500')}>
                  {selectedOption.icon}
                </span>
              )}
              <span className="truncate">{selectedOption.label}</span>
            </span>
          ) : (
            <span className={cn('truncate', variant === 'dark' ? 'text-slate-500' : 'text-gray-400')}>{placeholder}</span>
          )}
        </span>

        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 transition-transform duration-200',
            variant === 'dark' ? 'text-slate-400' : 'text-gray-400',
            isOpen && (variant === 'dark' ? 'rotate-180 text-teal-400' : 'rotate-180 text-gray-600')
          )}
        />
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          className={cn(
            'absolute z-50 w-full min-w-[200px] rounded-xl border p-1',
            variant === 'dark'
              ? 'bg-slate-900 border-slate-700 shadow-2xl text-slate-100'
              : 'bg-white border-gray-200 shadow-xl text-gray-900',
            openUpward
              ? 'bottom-full mb-1.5 origin-bottom'
              : 'top-full mt-1.5 origin-top',
            'animate-in fade-in zoom-in-95 duration-100'
          )}
        >
          {/* Optional Search Input */}
          {searchable && (
            <div className={cn('p-1 pb-1.5 border-b', variant === 'dark' ? 'border-slate-800' : 'border-gray-100')}>
              <div className="relative">
                <Search className={cn('absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none', variant === 'dark' ? 'text-slate-500' : 'text-gray-400')} />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setHighlightedIndex(0);
                  }}
                  placeholder={searchPlaceholder}
                  className={cn(
                    'w-full h-8 pl-9 pr-3 text-xs rounded-lg border focus:outline-none',
                    variant === 'dark'
                      ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-teal-500'
                      : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:bg-white focus:border-emerald-500'
                  )}
                />
              </div>
            </div>
          )}

          {/* Listbox */}
          <ul
            ref={listboxRef}
            role="listbox"
            tabIndex={-1}
            className="max-h-60 overflow-y-auto py-1 space-y-0.5"
          >
            {filteredOptions.length === 0 ? (
              <li className={cn('px-3 py-3 text-center text-xs italic', variant === 'dark' ? 'text-slate-500' : 'text-gray-400')}>
                No options found
              </li>
            ) : (
              filteredOptions.map((opt, idx) => {
                const isSelected = opt.value === value;
                const isHighlighted = idx === highlightedIndex;

                return (
                  <li
                    key={String(opt.value)}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(opt)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={cn(
                      'flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors cursor-pointer select-none',
                      variant === 'dark'
                        ? isSelected
                          ? 'bg-teal-500/20 text-teal-300 font-semibold'
                          : isHighlighted
                          ? 'bg-slate-800 text-white'
                          : 'text-slate-300 hover:bg-slate-800/70'
                        : isSelected
                        ? 'bg-emerald-50 text-emerald-800 font-semibold'
                        : isHighlighted
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-700 hover:bg-gray-50',
                      opt.disabled && 'opacity-50 cursor-not-allowed hover:bg-transparent'
                    )}
                  >
                    <span className="flex items-center gap-2 truncate">
                      {opt.dot && (
                        <span className={cn('h-2 w-2 rounded-full shrink-0', opt.dot)} />
                      )}
                      {opt.icon && (
                        <span className={cn('shrink-0 [&>svg]:h-4 [&>svg]:w-4', variant === 'dark' ? 'text-slate-400' : 'text-gray-500')}>
                          {opt.icon}
                        </span>
                      )}
                      <span className="truncate">{opt.label}</span>
                    </span>

                    {isSelected && (
                      <Check className={cn('h-4 w-4 shrink-0 ml-2', variant === 'dark' ? 'text-teal-400' : 'text-emerald-600')} />
                    )}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}

      {error && <p className="mt-1 text-xs text-rose-600 font-medium">{error}</p>}
    </div>
  );
}
