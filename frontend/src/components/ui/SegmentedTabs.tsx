import React from 'react';
import { cn } from '@/lib/utils';

export interface TabItem<T = string> {
  id: T;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

export interface SegmentedTabsProps<T = string> {
  tabs: TabItem<T>[];
  activeTab: T;
  onChange: (tabId: T) => void;
  className?: string;
}

export function SegmentedTabs<T extends string = string>({
  tabs,
  activeTab,
  onChange,
  className,
}: SegmentedTabsProps<T>) {
  return (
    <div
      role="tablist"
      className={cn(
        'inline-flex flex-wrap items-center gap-1 p-1 bg-gray-100 border border-gray-200/80 rounded-xl',
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              'inline-flex items-center justify-center gap-2 h-8 px-3 text-xs font-semibold rounded-lg transition-all select-none cursor-pointer',
              isActive
                ? 'bg-white text-gray-900 shadow-xs border border-gray-200/60'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
            )}
          >
            {tab.icon && (
              <span className="shrink-0 text-gray-500 [&>svg]:h-3.5 [&>svg]:w-3.5">
                {tab.icon}
              </span>
            )}
            <span>{tab.label}</span>
            {typeof tab.count === 'number' && (
              <span
                className={cn(
                  'inline-flex items-center justify-center min-w-[18px] h-4.5 px-1.5 text-[10px] font-bold rounded-full transition-colors',
                  isActive
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-gray-200 text-gray-600'
                )}
              >
                {tab.count > 99 ? '99+' : tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
