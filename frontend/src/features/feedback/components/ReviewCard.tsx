import React from 'react';
import { StarRating } from './StarRating';
import { cn } from '@/lib/utils';
import { ShieldCheck, Tag } from 'lucide-react';

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

function formatPatientDisplayName(rawName: string): string {
  const parts = rawName.trim().split(' ').filter(Boolean);
  if (parts.length === 0) return 'Verified Patient';
  if (parts.length === 1) return parts[0];
  const firstName = parts[0];
  const lastInitial = parts[parts.length - 1][0].toUpperCase();
  return `${firstName} ${lastInitial}.`;
}

export interface ReviewCardProps {
  feedback?: {
    id?: number;
    patientName?: string;
    rating: number;
    comment?: string | null;
    tags?: string[] | null;
    createdAt: string;
    updatedAt?: string | null;
    doctorSpecialization?: string;
  };
  patientName?: string;
  rating?: number;
  comment?: string | null;
  tags?: string[] | null;
  createdAt?: string;
  doctorSpecialization?: string;
  className?: string;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({
  feedback,
  patientName: propPatientName,
  rating: propRating,
  comment: propComment,
  tags: propTags,
  createdAt: propCreatedAt,
  doctorSpecialization: propDoctorSpecialization,
  className,
}) => {
  const rawName = feedback?.patientName || propPatientName || 'Verified Patient';
  const displayName = formatPatientDisplayName(rawName);
  const rating = feedback?.rating ?? propRating ?? 5;
  const comment = feedback?.comment !== undefined ? feedback.comment : propComment;
  const tags = feedback?.tags || propTags || [];
  const createdAt = feedback?.createdAt || propCreatedAt || new Date().toISOString();
  const doctorSpecialization = feedback?.doctorSpecialization || propDoctorSpecialization;

  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('') || 'P';

  const relativeTime = formatRelativeTime(createdAt);

  return (
    <div
      className={cn(
        'bg-white rounded-2xl p-4 sm:p-5 border border-gray-200/90 shadow-2xs hover:shadow-xs transition-shadow',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-linear-to-tr from-emerald-600 to-teal-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
            {initials}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs sm:text-sm font-bold text-gray-900">{displayName}</h4>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>Verified visit</span>
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <StarRating value={rating} readOnly size="sm" />
              {doctorSpecialization && (
                <span className="text-[11px] text-gray-500 hidden sm:inline">
                  &bull; {doctorSpecialization}
                </span>
              )}
            </div>
          </div>
        </div>

        <span className="text-[11px] font-medium text-gray-400 shrink-0">
          {relativeTime}
        </span>
      </div>

      {tags && tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 border border-gray-200/80"
            >
              <Tag className="w-2.5 h-2.5 text-gray-400" />
              <span>{tag}</span>
            </span>
          ))}
        </div>
      )}

      {comment ? (
        <p className="mt-3 text-xs sm:text-sm text-gray-700 leading-relaxed font-normal bg-gray-50/70 p-3 rounded-xl border border-gray-100">
          "{comment}"
        </p>
      ) : (
        <p className="mt-2 text-xs italic text-gray-400">
          (No written comment provided)
        </p>
      )}
    </div>
  );
};
