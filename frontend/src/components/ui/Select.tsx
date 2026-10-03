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
  className?: string;
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
  className,
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
          'w-full flex items-center justify-between gap-2 bg-white border font-normal text-left transition-all duration-150 shadow-2xs select-none cursor-pointer',
          sizes[size],
          error
            ? 'border-rose-400 focus:ring-rose-500/20 text-rose-900'
            : 'border-gray-200 hover:border-gray-300 text-gray-900',
          'focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500',
          disabled && 'opacity-60 cursor-not-allowed bg-gray-50'
        )}
      >
        <span className="flex items-center gap-2 truncate">
          {leadingIcon && (
            <span className="text-gray-400 shrink-0 [&>svg]:h-4 [&>svg]:w-4">
              {leadingIcon}
            </span>
          )}
          {selectedOption ? (
            <span className="flex items-center gap-2 truncate text-gray-900 font-medium">
              {selectedOption.dot && (
                <span className={cn('h-2 w-2 rounded-full shrink-0', selectedOption.dot)} />
              )}
              {selectedOption.icon && (
                <span className="shrink-0 text-gray-500 [&>svg]:h-4 [&>svg]:w-4">
                  {selectedOption.icon}
                </span>
              )}
              <span className="truncate">{selectedOption.label}</span>
            </span>
          ) : (
            <span className="text-gray-400 truncate">{placeholder}</span>
          )}
        </span>

        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200',
            isOpen && 'rotate-180 text-gray-600'
          )}
        />
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          className={cn(
            'absolute z-50 w-full min-w-[200px] rounded-xl bg-white border border-gray-200 shadow-xl p-1',
            openUpward
              ? 'bottom-full mb-1.5 origin-bottom'
              : 'top-full mt-1.5 origin-top',
            'animate-in fade-in zoom-in-95 duration-100'
          )}
        >
          {/* Optional Search Input */}
          {searchable && (
            <div className="p-1 pb-1.5 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setHighlightedIndex(0);
                  }}
                  placeholder={searchPlaceholder}
                  className="w-full h-8 pl-9 pr-3 text-xs bg-gray-50 rounded-lg border border-gray-200 focus:bg-white focus:outline-none focus:border-emerald-500 text-gray-900"
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
              <li className="px-3 py-3 text-center text-xs text-gray-400 italic">
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
                      isSelected
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
                        <span className="shrink-0 text-gray-500 [&>svg]:h-4 [&>svg]:w-4">
                          {opt.icon}
                        </span>
                      )}
                      <span className="truncate">{opt.label}</span>
                    </span>

                    {isSelected && (
                      <Check className="h-4 w-4 text-emerald-600 shrink-0 ml-2" />
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
