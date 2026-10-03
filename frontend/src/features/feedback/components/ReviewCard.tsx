import React from 'react';
import { StarRating } from './StarRating';
import { cn } from '@/lib/utils';

function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffSec < 60) return 'just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  } catch {
    return dateString;
  }
}

export interface ReviewCardProps {
  feedback?: {
    id?: number;
    patientName?: string;
    rating: number;
    comment?: string | null;
    createdAt: string;
    doctorSpecialization?: string;
  };
  patientName?: string;
  rating?: number;
  comment?: string | null;
  createdAt?: string;
  doctorSpecialization?: string;
  className?: string;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({
  feedback,
  patientName: propPatientName,
  rating: propRating,
  comment: propComment,
  createdAt: propCreatedAt,
  doctorSpecialization: propDoctorSpecialization,
  className,
}) => {
  const patientName = feedback?.patientName || propPatientName || 'Verified Patient';
  const rating = feedback?.rating ?? propRating ?? 5;
  const comment = feedback?.comment !== undefined ? feedback.comment : propComment;
  const createdAt = feedback?.createdAt || propCreatedAt || new Date().toISOString();
  const doctorSpecialization = feedback?.doctorSpecialization || propDoctorSpecialization;
  // Initials
  const initials = patientName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('') || 'P';

  const relativeTime = formatRelativeTime(createdAt);

  return (
    <div
      className={cn(
        'bg-white rounded-2xl p-5 border border-slate-100 shadow-2xs hover:shadow-xs transition-shadow',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-linear-to-tr from-emerald-600 to-teal-500 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-2xs">
            {initials}
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">{patientName}</h4>
            <div className="flex items-center gap-2 mt-0.5">
              <StarRating value={rating} readOnly size="sm" />
              {doctorSpecialization && (
                <span className="text-[11px] text-slate-500 hidden sm:inline">
                  • {doctorSpecialization}
                </span>
              )}
            </div>
          </div>
        </div>

        <span className="text-[11px] font-medium text-slate-600 shrink-0">
          {relativeTime}
        </span>
      </div>

      {comment ? (
        <p className="mt-3 text-xs sm:text-sm text-slate-700 leading-relaxed font-normal bg-slate-50/60 p-3 rounded-xl border border-slate-100/80">
          "{comment}"
        </p>
      ) : (
        <p className="mt-2 text-xs italic text-slate-600">
          (No written comment provided)
        </p>
      )}
    </div>
  );
};
