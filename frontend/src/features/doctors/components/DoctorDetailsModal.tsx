import React from 'react';
import { Doctor } from '../types/doctor.types';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { getImageUrl } from '@/lib/utils';
import {
  Calendar,
  Award,
  Clock,
  DollarSign,
  ShieldCheck,
  MapPin,
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

  const fullImageUrl = doctor.imagePath ? getImageUrl(doctor.imagePath) : undefined;

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="lg" title="Doctor Profile & Credentials">
      <div className="space-y-6 pt-2">
        {/* Top Header Card */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 p-4 rounded-2xl bg-gradient-to-br from-emerald-50/70 via-teal-50/40 to-slate-50 border border-emerald-100/80">
          <div className="relative shrink-0">
            {fullImageUrl ? (
              <img
                src={fullImageUrl}
                alt={doctor.user.name}
                className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl object-cover border-2 border-white shadow-md"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <Avatar
                src={doctor.thumbnailPath}
                name={doctor.user.name}
                size="xl"
                className="border-2 border-white shadow-md text-2xl"
              />
            )}
            <div className="absolute -bottom-2 -right-2 bg-emerald-600 text-white p-1 rounded-full shadow">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>

          <div className="text-center sm:text-left flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
              <h2 className="text-xl font-bold text-slate-900">{doctor.user.name}</h2>
              <Badge variant="success">Verified Physician</Badge>
            </div>
            <p className="text-sm font-semibold text-emerald-700">{doctor.specialization}</p>
            <p className="text-xs text-slate-500 mt-0.5">{doctor.department?.name || 'General Clinical Department'}</p>

            {doctor.licenseNumber && (
              <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 border border-blue-200 text-blue-800 text-xs font-mono font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Lic: {doctor.licenseNumber}</span>
              </div>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
            <Award className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
            <p className="text-slate-400 text-[11px]">Qualification</p>
            <p className="font-semibold text-slate-800 mt-0.5">{doctor.qualification || 'MD / MBBS'}</p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
            <Clock className="w-4 h-4 text-sky-600 mx-auto mb-1" />
            <p className="text-slate-400 text-[11px]">Clinical Exp.</p>
            <p className="font-semibold text-slate-800 mt-0.5">{doctor.experienceYears} Years</p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
            <DollarSign className="w-4 h-4 text-amber-600 mx-auto mb-1" />
            <p className="text-slate-400 text-[11px]">Consultation Fee</p>
            <p className="font-bold text-emerald-700 mt-0.5">${doctor.consultationFee?.toFixed(2)}</p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
            <MapPin className="w-4 h-4 text-purple-600 mx-auto mb-1" />
            <p className="text-slate-400 text-[11px]">Room / Clinic</p>
            <p className="font-semibold text-slate-800 mt-0.5">{doctor.roomNumber || 'Room 101'}</p>
          </div>
        </div>

        {/* Bio */}
        {doctor.bio && (
          <div className="space-y-1.5">
            <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">About Doctor</h4>
            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50/60 p-3 rounded-xl border border-slate-100">
              {doctor.bio}
            </p>
          </div>
        )}

        {/* Weekly Availability Schedule */}
        {doctor.schedules && doctor.schedules.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Weekly Schedule</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {doctor.schedules
                .filter((s) => s.isAvailable)
                .map((schedule, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg border border-slate-200/80 bg-white text-xs">
                    <p className="font-bold text-slate-800 capitalize">{schedule.dayOfWeek}</p>
                    <p className="text-[11px] text-emerald-700 font-medium mt-0.5">
                      {schedule.startTime} - {schedule.endTime}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Modal Actions */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
          <Button
            size="sm"
            onClick={() => {
              onClose();
              onBookAppointment(doctor.id);
            }}
            leftIcon={<Calendar className="w-4 h-4" />}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Book Appointment
          </Button>
        </div>
      </div>
    </Modal>
  );
};
