import React, { useState } from 'react';
import { AlertCircle, ArrowRight, Clock, Calendar } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { useDoctorSlots, useRescheduleAppointment } from '../hooks/useAppointments';
import { Appointment } from '../types/appointment.types';

export interface RescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment;
  onSuccess?: () => void;
}

export const RescheduleModal: React.FC<RescheduleModalProps> = ({
  isOpen,
  onClose,
  appointment,
  onSuccess,
}) => {
  const { toast } = useToast();
  const rescheduleMutation = useRescheduleAppointment();

  // Find tomorrow's date by default
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDate = tomorrow.toISOString().split('T')[0];

  const [date, setDate] = useState<string>(defaultDate);
  const [selectedSlot, setSelectedSlot] = useState<{ startTime: string; endTime: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const doctorId = appointment.doctor.id;
  const { data: slotsData, isLoading: isLoadingSlots } = useDoctorSlots(doctorId, date);

  const handleReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!date) {
      setErrorMessage('Please select a new appointment date.');
      return;
    }
    if (!selectedSlot) {
      setErrorMessage('Please pick an available time slot.');
      return;
    }

    try {
      await rescheduleMutation.mutateAsync({
        id: appointment.id,
        date,
        startTime: selectedSlot.startTime,
      });

      toast('Appointment rescheduled successfully!', 'success');
      onSuccess?.();
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to reschedule appointment.';
      setErrorMessage(msg);
      toast(msg, 'error');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reschedule Appointment"
      description={`Choose a new date and consultation slot with Dr. ${appointment.doctor.name}.`}
      maxWidth="md"
    >
      <form onSubmit={handleReschedule} className="space-y-4">
        {errorMessage && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
            <span className="font-semibold">{errorMessage}</span>
          </div>
        )}

        {/* Current vs New Time Comparison Box */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            Schedule Comparison
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
            {/* Current */}
            <div className="p-2.5 rounded-lg bg-white border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Current Time
              </span>
              <div className="flex items-center gap-1.5 mt-1 text-slate-800 font-bold text-xs">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>{appointment.appointmentDate}</span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5 text-slate-600 text-xs">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{appointment.startTime} - {appointment.endTime}</span>
              </div>
            </div>

            {/* New */}
            <div className={`p-2.5 rounded-lg border transition-all ${
              selectedSlot
                ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900'
                : 'bg-white border-dashed border-slate-300 text-slate-400'
            }`}>
              <span className="text-[10px] font-bold uppercase tracking-wider block">
                New Time
              </span>
              {selectedSlot ? (
                <>
                  <div className="flex items-center gap-1.5 mt-1 font-bold text-xs text-emerald-950">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{date}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5 text-xs text-emerald-800 font-semibold">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{selectedSlot.startTime} - {selectedSlot.endTime}</span>
                  </div>
                </>
              ) : (
                <p className="text-xs italic mt-1.5">Pick date & slot below</p>
              )}
            </div>
          </div>

          <div className="mt-2 text-[11px] text-amber-700 bg-amber-50/70 p-2 rounded-lg border border-amber-200/60 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
            <span>
              Reschedules must be requested at least 2 hours before the appointment. Max 2 per appointment.
              {appointment.rescheduleCount ? ` (Rescheduled ${appointment.rescheduleCount} time${appointment.rescheduleCount > 1 ? 's' : ''})` : ''}
            </span>
          </div>
        </div>

        {/* Date Selection */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
            Select New Date *
          </label>
          <input
            type="date"
            min={new Date().toISOString().split('T')[0]}
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setSelectedSlot(null);
            }}
            className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-hidden"
            required
          />
        </div>

        {/* Slot Grid */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider flex items-center justify-between">
            <span>Available Time Slots *</span>
            {slotsData?.dayOfWeek && (
              <span className="text-[11px] font-medium text-slate-500 capitalize">
                Shift: {slotsData.dayOfWeek}
              </span>
            )}
          </label>

          {isLoadingSlots ? (
            <div className="py-6 text-center text-xs text-slate-400">Loading clinic slots...</div>
          ) : !slotsData?.hasSchedule ? (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
              Dr. {appointment.doctor.name} does not have an active shift on {slotsData?.dayOfWeek || 'this day'}. Please select another date.
            </div>
          ) : slotsData.slots.length === 0 ? (
            <div className="p-3 rounded-xl bg-slate-100 text-slate-600 text-xs">
              No available appointment slots found for this date.
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1">
              {slotsData.slots.map((slot) => {
                const isSelected = selectedSlot?.startTime === slot.startTime;
                return (
                  <button
                    key={slot.startTime}
                    type="button"
                    disabled={!slot.isAvailable}
                    onClick={() => setSelectedSlot(slot)}
                    className={`py-2 px-1 text-center rounded-xl border text-xs font-semibold transition-all ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-600/30'
                        : slot.isAvailable
                        ? 'border-emerald-200 bg-emerald-50/50 text-emerald-800 hover:bg-emerald-100 hover:border-emerald-300 cursor-pointer'
                        : 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed line-through'
                    }`}
                  >
                    <span>{slot.startTime}</span>
                    <span className="block text-[9px] font-normal opacity-80">
                      {slot.isAvailable ? 'Open' : 'Booked'}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={rescheduleMutation.isPending}
            disabled={!selectedSlot}
            className="flex items-center gap-1.5"
          >
            <span>Confirm Reschedule</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </form>
    </Modal>
  );
};
