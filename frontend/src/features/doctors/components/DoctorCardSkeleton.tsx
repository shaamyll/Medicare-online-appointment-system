import React from 'react';

export const DoctorCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-3xl p-3 sm:p-3.5 border border-slate-200/80 shadow-xs animate-pulse flex flex-col justify-between">
      {/* Photo skeleton */}
      <div className="w-full aspect-square sm:aspect-[4/4.2] rounded-2xl bg-slate-200" />

      {/* Info skeleton */}
      <div className="pt-3 space-y-2">
        {/* Meta badges */}
        <div className="flex items-center gap-3 px-1">
          <div className="h-3 w-14 bg-slate-200 rounded-md" />
          <div className="h-3 w-16 bg-slate-200 rounded-md" />
        </div>

        {/* Doctor Name */}
        <div className="flex items-center gap-2 px-1 pt-1">
          <div className="h-5 w-3/4 bg-slate-200 rounded-md" />
          <div className="h-4 w-4 bg-slate-200 rounded-full shrink-0" />
        </div>

        {/* Short description */}
        <div className="space-y-1 px-1">
          <div className="h-3 w-full bg-slate-100 rounded-md" />
          <div className="h-3 w-4/5 bg-slate-100 rounded-md" />
        </div>

        {/* Button */}
        <div className="h-8.5 w-full bg-slate-100 rounded-xl mt-3.5" />
      </div>
    </div>
  );
};
