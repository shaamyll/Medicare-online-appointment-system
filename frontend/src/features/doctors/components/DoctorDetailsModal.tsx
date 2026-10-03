import React from 'react';
import { Doctor } from '../types/doctor.types';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { getImageUrl } from '@/lib/utils';
import { useDoctorFeedback } from '@/features/feedback/hooks/useFeedback';
import { RatingSummary } from '@/features/feedback/components/RatingSummary';
import { ReviewCard } from '@/features/feedback/components/ReviewCard';
import {
  Calendar,
  Award,
  Clock,
  ShieldCheck,
  Star,
  MessageSquare,
  Sparkles,
} from 'lucide-react';

interface DoctorDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctor: Doctor | null;
  onBookAppointment: (doctorId: number) => void;
}

export const DoctorDetailsModal: React.FC<DoctorDetailsModalProps> = ({
  isOpen,
  onClose,
  doctor,
  onBookAppointment,
}) => {
  if (!doctor) return null;

  const rawPhoto = doctor.thumbnailPath || doctor.imagePath;
  const fullImageUrl = rawPhoto ? getImageUrl(rawPhoto) : undefined;
  const { data: feedbackData } = useDoctorFeedback(doctor.id, 1, 5);

  const ratingAvg = feedbackData?.ratingAvg ?? doctor.ratingAvg ?? 0;
  const ratingCount = feedbackData?.total ?? doctor.ratingCount ?? 0;

  const initials = doctor.user?.name
    ? doctor.user.name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((n) => n[0].toUpperCase())
        .join('')
    : 'DR';

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="xl" title="Doctor Profile & Reviews">
      <div className="space-y-6 pt-2 max-h-[75vh] overflow-y-auto px-1">
        {/* Top Header Card */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 p-6 rounded-2xl bg-gradient-to-br from-emerald-50/70 via-teal-50/40 to-slate-50 border border-emerald-100/80 shadow-2xs">
          <div className="relative shrink-0">
            {fullImageUrl ? (
              <img
                src={fullImageUrl}
                alt={doctor.user.name}
                className="w-28 h-36 sm:w-32 sm:h-40 rounded-2xl object-cover object-top border-2 border-white shadow-md"
              />
            ) : (
              <div className="w-28 h-36 sm:w-32 sm:h-40 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-700 text-white flex flex-col items-center justify-center font-black text-3xl shadow-md border-2 border-white">
                {initials}
              </div>
            )}
            <div className="absolute -bottom-2 -right-2 bg-emerald-600 text-white p-1.5 rounded-full shadow-md">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>

          <div className="text-center sm:text-left flex-1 space-y-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {doctor.user.name}
              </h2>
              <Badge variant="success">Verified Physician</Badge>
            </div>

            <p className="text-sm font-bold text-emerald-700">{doctor.specialization}</p>
            <p className="text-xs text-slate-500 font-medium">
              Department of {doctor.department?.name || 'General Clinical Medicine'}
              {doctor.roomNumber ? ` • ${doctor.roomNumber}` : ''}
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-0.5">
              {doctor.licenseNumber && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700 text-xs font-mono font-semibold shadow-2xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Lic: {doctor.licenseNumber}</span>
                </div>
              )}
              {doctor.nextAvailable && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Next: {doctor.nextAvailable}</span>
                </div>
              )}
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-3">
              <Button
                variant="primary"
                onClick={() => {
                  onClose();
                  onBookAppointment(doctor.id);
                }}
                className="flex items-center gap-2 shadow-xs"
                leftIcon={<Calendar className="w-4 h-4" />}
              >
                <span>Book Appointment</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
            <Award className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Qualification</p>
            <p className="font-bold text-slate-800 mt-0.5 truncate">{doctor.qualification || 'MD / MBBS'}</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
            <Clock className="w-4 h-4 text-sky-600 mx-auto mb-1" />
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Experience</p>
            <p className="font-bold text-slate-800 mt-0.5">{doctor.experienceYears} Years</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
            <Sparkles className="w-4 h-4 text-amber-600 mx-auto mb-1" />
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Consultation Fee</p>
            <p className="font-black text-emerald-700 mt-0.5 text-sm">
              Rs. {Number(doctor.consultationFee || 0).toFixed(0)}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
            <Star className="w-4 h-4 text-amber-500 fill-amber-400 mx-auto mb-1" />
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Patient Rating</p>
            <p className="font-bold text-slate-800 mt-0.5 truncate">
              {ratingAvg > 0 ? `${ratingAvg.toFixed(1)} ★` : '5.0 ★'}
              {ratingCount > 0 && (
                <span className="text-[10px] font-normal text-slate-400 ml-1">({ratingCount})</span>
              )}
            </p>
          </div>
        </div>

        {/* Bio */}
        {doctor.bio && (
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">About Physician</h4>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed bg-slate-50/70 p-4 rounded-xl border border-slate-100">
              {doctor.bio}
            </p>
          </div>
        )}

        {/* Weekly Availability Schedule */}
        {doctor.schedules && doctor.schedules.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Weekly Schedule & Shifts</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {doctor.schedules
                .filter((s) => s.isAvailable)
                .map((schedule, idx) => (
                  <div key={idx} className="p-3 rounded-xl border border-slate-200/80 bg-white text-xs">
                    <p className="font-bold text-slate-800 capitalize">{schedule.dayOfWeek}</p>
                    <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                      {schedule.startTime} - {schedule.endTime}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Reviews Section */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-amber-500" />
              Patient Reviews & Ratings
            </h4>
            <span className="text-xs text-slate-500">
              {feedbackData?.total ?? doctor.ratingCount ?? 0} total reviews
            </span>
          </div>

          <RatingSummary
            ratingAvg={feedbackData?.ratingAvg ?? doctor.ratingAvg ?? 0}
            ratingCount={feedbackData?.ratingCount ?? doctor.ratingCount ?? 0}
            distribution={feedbackData?.distribution}
          />

          {feedbackData && feedbackData.items.length > 0 ? (
            <div className="space-y-3">
              {feedbackData.items.map((rev) => (
                <ReviewCard
                  key={rev.id}
                  patientName={rev.patientName || 'Verified Patient'}
                  rating={rev.rating}
                  comment={rev.comment}
                  createdAt={rev.createdAt}
                />
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic text-center py-4 bg-slate-50 rounded-xl">
              No written reviews submitted for Dr. {doctor.user.name} yet.
            </p>
          )}
        </div>

        {/* Modal Actions */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              onClose();
              onBookAppointment(doctor.id);
            }}
            className="flex items-center gap-1.5"
            leftIcon={<Calendar className="w-4 h-4" />}
          >
            <span>Book Appointment</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
};
