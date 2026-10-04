import React, { useState, useMemo, useEffect } from 'react';
import { AlertCircle, Calendar, Clock, ShieldCheck, Star } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { useDoctor } from '@/features/doctors/hooks/useDoctors';
import { useDoctorSlots, useBookAppointment } from '@/features/appointments/hooks/useAppointments';
import { Doctor } from '@/features/doctors/types/doctor.types';
import { getImageUrl } from '@/lib/utils';

export interface AppointmentBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctorId: number;
  initialDoctor?: Doctor | null;
  onSuccess?: () => void;
}

export const AppointmentBookingModal: React.FC<AppointmentBookingModalProps> = ({
  isOpen,
  onClose,
  doctorId,
  initialDoctor,
  onSuccess,
}) => {
  const { toast } = useToast();
  const bookMutation = useBookAppointment();

  // Load complete doctor details including schedule
  const { data: fetchedDoctor } = useDoctor(doctorId);
  const doctor = fetchedDoctor || initialDoctor;

  // Determine working days from doctor's schedules
  const workingDaysSet = useMemo(() => {
    const schedules = doctor?.schedules || [];
    const active = schedules.filter((s) => s.isAvailable !== false);
    return new Set(active.map((s) => (s.dayOfWeek || '').toLowerCase()));
  }, [doctor]);

  // Find first available working date starting from tomorrow
  const defaultDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    for (let i = 0; i < 14; i++) {
      const dayName = d.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      if (workingDaysSet.size === 0 || workingDaysSet.has(dayName)) {
        return d.toISOString().split('T')[0];
      }
      d.setDate(d.getDate() + 1);
    }
    const fallback = new Date();
    fallback.setDate(fallback.getDate() + 1);
    return fallback.toISOString().split('T')[0];
  }, [workingDaysSet]);

  const [date, setDate] = useState<string>(defaultDate);
  const [selectedSlot, setSelectedSlot] = useState<{ startTime: string; endTime: string } | null>(null);
  const [reason, setReason] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  // Sync date when defaultDate is determined
  useEffect(() => {
    if (defaultDate) {
      setDate(defaultDate);
      setSelectedSlot(null);
    }
  }, [defaultDate, doctorId]);

  // Query live slots for doctor and selected date
  const { data: slotsData, isLoading: isLoadingSlots } = useDoctorSlots(doctorId, date);

  // Derive photo url
  const rawPhoto = doctor?.thumbnailPath || doctor?.imagePath;
  const photoUrl = rawPhoto && !imageError ? getImageUrl(rawPhoto) : null;
  const initials = doctor?.user?.name
    ? doctor.user.name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((n) => n[0].toUpperCase())
        .join('')
    : 'DR';

  const doctorName = doctor?.user?.name
    ? doctor.user.name.startsWith('Dr.')
      ? doctor.user.name
      : `Dr. ${doctor.user.name}`
    : 'Doctor Specialist';

  // 14-day interactive strip starting from today
  const dateStrip = useMemo(() => {
    const list = [];
    const now = new Date();
    for (let i = 1; i <= 14; i++) {
      const cur = new Date();
      cur.setDate(now.getDate() + i);
      const iso = cur.toISOString().split('T')[0];
      const dayName = cur.toLocaleDateString('en-US', { weekday: 'short' });
      const fullDay = cur.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const dayNum = cur.getDate();
      const month = cur.toLocaleDateString('en-US', { month: 'short' });
      const isWorkingDay = workingDaysSet.size === 0 || workingDaysSet.has(fullDay);
      list.push({ iso, dayName, dayNum, month, isWorkingDay });
    }
    return list;
  }, [workingDaysSet]);

  const selectedDateObj = useMemo(() => {
    if (!date) return null;
    return new Date(date + 'T00:00:00');
  }, [date]);

  const selectedDayOfWeek = selectedDateObj
    ? selectedDateObj.toLocaleDateString('en-US', { weekday: 'long' })
    : '';

  const isSelectedDateWorking =
    workingDaysSet.size === 0 || workingDaysSet.has(selectedDayOfWeek.toLowerCase());

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!doctorId) {
      setErrorMessage('Doctor could not be identified.');
      return;
    }
    if (!date) {
      setErrorMessage('Please select an appointment date.');
      return;
    }
    if (!selectedSlot) {
      setErrorMessage('Please pick an available time slot.');
      return;
    }

    try {
      await bookMutation.mutateAsync({
        doctorId,
        appointmentDate: date,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        reasonForVisit: reason.trim(),
      });

      toast('Your request was sent. You can pay after the doctor approves it.', 'success');
      onSuccess?.();
      onClose();
      setSelectedSlot(null);
      setReason('');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to book appointment';
      setErrorMessage(msg);
      toast(msg, 'error');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Book Doctor Consultation"
      description="Select your preferred date and available consultation time slot"
      maxWidth="4xl"
    >
      <form onSubmit={handleBook} className="space-y-5 text-xs">
        {errorMessage && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
            <span className="font-medium text-xs">{errorMessage}</span>
          </div>
        )}

        {/* 1. Read-only Doctor Summary Card */}
        <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200/90 flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-14 rounded-xl bg-slate-200 overflow-hidden shrink-0 flex items-center justify-center font-bold text-slate-600 border border-gray-200">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt={doctorName}
                  onError={() => setImageError(true)}
                  className="w-full h-full object-cover object-top"
                />
              ) : (
                <span className="text-base font-extrabold">{initials}</span>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h4 className="text-sm font-bold text-gray-900 truncate">{doctorName}</h4>
                <ShieldCheck className="w-3.5 h-3.5 text-sky-500 fill-sky-500 shrink-0" />
              </div>
              <p className="text-[11px] font-semibold text-emerald-700 truncate">
                {doctor?.specialization || 'Clinical Specialist'}
              </p>
              <div className="flex items-center gap-2 text-[10px] text-gray-500 mt-0.5">
                <span>{doctor?.department?.name || 'General Medicine'}</span>
                {doctor?.ratingAvg && doctor.ratingAvg > 0 ? (
                  <span className="inline-flex items-center gap-0.5 text-amber-600 font-semibold">
                    <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                    <span>{doctor.ratingAvg.toFixed(1)}</span>
                    {doctor.ratingCount ? <span>({doctor.ratingCount})</span> : null}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">
              Consultation Fee
            </span>
            <span className="text-base font-extrabold text-gray-900">
              ${Number(doctor?.consultationFee || 0).toFixed(2)}
            </span>
          </div>
        </div>

        {/* 2. Date Selection (Interactive Strip + Custom Date Input) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              <span>Select Consultation Date *</span>
            </label>
            <input
              type="date"
              min={new Date().toISOString().split('T')[0]}
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setSelectedSlot(null);
              }}
              className="text-xs h-7 px-2 py-0.5 rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-hidden focus:border-emerald-500"
            />
          </div>

          {/* Quick Date Strip */}
          <div className="flex gap-2 overflow-x-auto pb-1.5 pt-0.5 scrollbar-thin">
            {dateStrip.map((item) => {
              const isSelected = date === item.iso;
              return (
                <button
                  key={item.iso}
                  type="button"
                  disabled={!item.isWorkingDay}
                  onClick={() => {
                    setDate(item.iso);
                    setSelectedSlot(null);
                  }}
                  className={`flex flex-col items-center justify-center min-w-[56px] py-2 px-1.5 rounded-xl border text-center transition-all cursor-pointer ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-600/30'
                      : item.isWorkingDay
                      ? 'border-gray-200 bg-white hover:bg-gray-50 text-gray-800 hover:border-gray-300'
                      : 'border-gray-100 bg-gray-100/70 text-gray-300 cursor-not-allowed opacity-50'
                  }`}
                  title={
                    item.isWorkingDay
                      ? `${item.dayName}, ${item.month} ${item.dayNum}`
                      : `${doctorName} does not consult on ${item.dayName}`
                  }
                >
                  <span className={`text-[10px] font-medium uppercase ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                    {item.dayName}
                  </span>
                  <span className="text-sm font-bold my-0.5">{item.dayNum}</span>
                  <span className={`text-[9px] ${isSelected ? 'text-emerald-100' : 'text-gray-400'}`}>
                    {item.month}
                  </span>
                </button>
              );
            })}
          </div>

          {!isSelectedDateWorking && (
            <div className="mt-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>
                {doctorName} does not hold clinical shifts on {selectedDayOfWeek}s. Please pick a working day (e.g.{' '}
                {Array.from(workingDaysSet)
                  .map((d) => d.charAt(0).toUpperCase() + d.slice(1))
                  .join(', ') || 'available scheduled days'}
                ).
              </span>
            </div>
          )}
        </div>

        {/* 3. Available Time Slots Grid */}
        <div>
          <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider flex items-center justify-between mb-2">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              <span>Available Time Slots *</span>
            </span>
            {slotsData?.dayOfWeek && (
              <span className="text-[10px] font-normal text-gray-500 capitalize">
                Shift: {slotsData.dayOfWeek}
              </span>
            )}
          </label>

          {isLoadingSlots ? (
            <div className="py-8 text-center text-gray-400 text-xs">
              <span className="inline-block animate-pulse">Checking doctor shift & booked slots...</span>
            </div>
          ) : !slotsData?.hasSchedule ? (
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-gray-600 text-center text-[11px]">
              No active clinic schedule found for {selectedDayOfWeek || 'this date'}.
            </div>
          ) : slotsData.slots.length === 0 ? (
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-gray-600 text-center text-[11px]">
              No slots available on this day.
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-0.5">
              {slotsData.slots.map((slot) => {
                const isSelected = selectedSlot?.startTime === slot.startTime;
                return (
                  <button
                    key={slot.startTime}
                    type="button"
                    disabled={!slot.isAvailable}
                    onClick={() => setSelectedSlot(slot)}
                    className={`py-2 px-1 text-center rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-600/30'
                        : slot.isAvailable
                        ? 'border-gray-200 bg-white hover:bg-emerald-50 hover:border-emerald-300 text-gray-800'
                        : 'border-gray-100 bg-gray-100 text-gray-400 cursor-not-allowed line-through opacity-60'
                    }`}
                  >
                    <span>{slot.startTime}</span>
                    <span className={`block text-[9px] font-normal ${isSelected ? 'text-white/90' : slot.isAvailable ? 'text-emerald-700' : 'text-gray-400'}`}>
                      {slot.isAvailable ? 'Available' : 'Booked'}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 4. Reason for Visit (max 255 chars with counter) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">
              Reason for Visit / Symptoms (Optional)
            </label>
            <span className={`text-[10px] ${reason.length > 240 ? 'text-amber-600 font-bold' : 'text-gray-400'}`}>
              {reason.length}/255
            </span>
          </div>
          <textarea
            rows={2}
            maxLength={255}
            placeholder="Briefly describe your symptoms or reason for consultation..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white p-2.5 text-xs text-gray-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden resize-none"
          />
        </div>

        {/* 5. Summary Row + Confirm Button */}
        <div className="pt-3 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50 -mx-6 -mb-6 p-4 rounded-b-2xl border-t border-gray-200">
          <div className="text-xs text-gray-600 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="font-semibold text-gray-900">
              {selectedDateObj
                ? selectedDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                : date}
            </span>
            <span>&bull;</span>
            <span className={selectedSlot ? 'font-semibold text-emerald-800' : 'text-gray-400'}>
              {selectedSlot ? `${selectedSlot.startTime} - ${selectedSlot.endTime}` : 'No slot chosen'}
            </span>
            <span>&bull;</span>
            <span className="font-extrabold text-gray-900">
              ${Number(doctor?.consultationFee || 0).toFixed(2)}
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button variant="outline" type="button" onClick={onClose} size="sm" className="flex-1 sm:flex-initial">
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={bookMutation.isPending}
              disabled={!selectedSlot}
              size="sm"
              className="flex-1 sm:flex-initial shadow-xs"
            >
              Confirm Booking
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
