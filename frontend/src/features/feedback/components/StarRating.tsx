import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StarRatingProps {
  value: number; // 0 to 5
  onChange?: (value: number) => void;
  readOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  count?: number;
  className?: string;
}

export const StarRating: React.FC<StarRatingProps> = ({
  value,
  onChange,
  readOnly = false,
  size = 'md',
  showCount = false,
  count,
  className,
}) => {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const starSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-6 h-6',
  };

  const activeValue = hoverValue !== null ? hoverValue : value;

  return (
    <div className={cn('inline-flex items-center gap-1', className)}>
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((starIndex) => {
          const isFilled = activeValue >= starIndex;
          const isHalf = !readOnly ? false : activeValue >= starIndex - 0.5 && activeValue < starIndex;

          return (
            <button
              key={starIndex}
              type="button"
              disabled={readOnly}
              onClick={() => onChange && onChange(starIndex)}
              onMouseEnter={() => !readOnly && setHoverValue(starIndex)}
              onMouseLeave={() => !readOnly && setHoverValue(null)}
              className={cn(
                'relative p-0.5 transition-transform',
                readOnly
                  ? 'cursor-default pointer-events-none'
                  : 'cursor-pointer hover:scale-110 focus:outline-hidden'
              )}
              aria-label={`${starIndex} Stars`}
            >
              {isHalf ? (
                <div className="relative">
                  <Star className={cn(starSizes[size], 'text-slate-200 fill-slate-200')} />
                  <div className="absolute top-0 left-0 w-1/2 overflow-hidden">
                    <Star className={cn(starSizes[size], 'text-amber-400 fill-amber-400')} />
                  </div>
                </div>
              ) : (
                <Star
                  className={cn(
                    starSizes[size],
                    isFilled
                      ? 'text-amber-400 fill-amber-400'
                      : 'text-slate-200 fill-slate-100'
                  )}
                />
              )}
            </button>
          );
        })}
      </div>

      {showCount && typeof count === 'number' && (
        <span className="text-xs font-medium text-slate-500 ml-1">
          ({count})
        </span>
      )}
    </div>
  );
};
