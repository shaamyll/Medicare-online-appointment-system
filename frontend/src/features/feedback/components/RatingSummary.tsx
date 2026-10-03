import React from 'react';
import { StarRating } from './StarRating';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface RatingSummaryProps {
  ratingAvg: number;
  ratingCount: number;
  distribution?: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  className?: string;
}

export const RatingSummary: React.FC<RatingSummaryProps> = ({
  ratingAvg,
  ratingCount,
  distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  className,
}) => {
  const maxCount = Math.max(
    1,
    distribution[5] || 0,
    distribution[4] || 0,
    distribution[3] || 0,
    distribution[2] || 0,
    distribution[1] || 0
  );

  return (
    <div
      className={cn(
        'bg-white rounded-2xl p-6 border border-slate-100 shadow-xs flex flex-col md:flex-row gap-6 md:gap-10 items-center',
        className
      )}
    >
      {/* Big Average & Stars */}
      <div className="flex flex-col items-center justify-center shrink-0 min-w-[140px] text-center border-b md:border-b-0 md:border-r border-slate-100 pb-4 md:pb-0 md:pr-8">
        <div className="text-5xl font-black text-slate-900 tracking-tight">
          {ratingAvg > 0 ? ratingAvg.toFixed(1) : '0.0'}
        </div>
        <div className="mt-2">
          <StarRating value={ratingAvg} readOnly size="md" />
        </div>
        <p className="text-xs font-semibold text-slate-500 mt-1.5">
          Based on {ratingCount} {ratingCount === 1 ? 'review' : 'reviews'}
        </p>
      </div>

      {/* Distribution Bars */}
      <div className="flex-1 w-full space-y-2">
        {[5, 4, 3, 2, 1].map((stars) => {
          const count = distribution[stars as keyof typeof distribution] || 0;
          const barWidth = ratingCount > 0 ? (count / maxCount) * 100 : 0;

          return (
            <div key={stars} className="flex items-center gap-3 text-xs">
              <span className="w-7 font-bold text-slate-700 flex items-center justify-end gap-1">
                {stars} <Star className="w-3 h-3 text-amber-400 fill-amber-400 inline" />
              </span>
              <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500"
                  style={{ width: `${barWidth}%` }}
                />
              </div>
              <span className="w-10 text-right text-slate-500 font-medium">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
