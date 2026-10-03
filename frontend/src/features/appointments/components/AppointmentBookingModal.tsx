import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import { useDoctors } from '@/features/doctors/hooks/useDoctors';
import { useDoctorSlots, useBookAppointment } from '@/features/appointments/hooks/useAppointments';

interface AppointmentBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedDoctorId?: number;
  onSuccess?: () => void;
}

export const AppointmentBookingModal: React.FC<AppointmentBookingModalProps> = ({
  isOpen,
  onClose,
  preselectedDoctorId,
  onSuccess,
}) => {
  const { toast } = useToast();
  const { data: doctors } = useDoctors();
  const bookMutation = useBookAppointment();

  // Find tomorrow's date by default
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDate = tomorrow.toISOString().split('T')[0];

  const [doctorId, setDoctorId] = useState<number>(preselectedDoctorId || 0);
  const [date, setDate] = useState<string>(defaultDate);
  const [selectedSlot, setSelectedSlot] = useState<{ startTime: string; endTime: string } | null>(null);
  const [reason, setReason] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Set default doctor when list loads
  React.useEffect(() => {
    if (preselectedDoctorId) {
      setDoctorId(preselectedDoctorId);
    } else if (doctors && doctors.length > 0 && !doctorId) {
      setDoctorId(doctors[0].id);
    }
  }, [doctors, preselectedDoctorId]);

  // Query live slots for doctor and date
  const { data: slotsData, isLoading: isLoadingSlots } = useDoctorSlots(doctorId, date);

  const selectedDoctor = doctors?.find((d) => d.id === doctorId);

  const doctorOptions = (doctors || []).map((doc) => ({
    value: String(doc.id),
    label: `${doc.user.name} - ${doc.specialization} (${doc.department?.name || 'General'}) • $${doc.consultationFee}`,
  }));

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!doctorId) {
      setErrorMessage('Please select a doctor.');
      return;
    }
    if (!date) {
      setErrorMessage('Please select an appointment date.');
      return;
    }
    if (!selectedSlot) {
      setErrorMessage('Please select an available time slot.');
      return;
    }

    try {
      await bookMutation.mutateAsync({
        doctorId,
        appointmentDate: date,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        reasonForVisit: reason,
      });

      toast('Appointment scheduled successfully!', 'success');
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
      description="Choose your preferred doctor, select an available date, and pick your consultation slot."
    >
      <form onSubmit={handleBook} className="space-y-4 text-xs">
        {errorMessage && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
            <span className="font-medium">{errorMessage}</span>
          </div>
        )}

        {/* Doctor Selection */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">
            Select Medical Specialist *
          </label>
          <Select
            value={doctorId ? String(doctorId) : ''}
            onChange={(val) => {
              setDoctorId(Number(val));
              setSelectedSlot(null);
            }}
            options={doctorOptions}
            placeholder="Select Doctor"
            searchable
          />

          {selectedDoctor && (
            <div className="mt-2 p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-100 flex items-center justify-between text-xs">
              <span className="text-emerald-900 font-medium">
                {selectedDoctor.qualification} &bull; {selectedDoctor.experienceYears} Years Exp.
              </span>
              <span className="font-bold text-emerald-800">${selectedDoctor.consultationFee?.toFixed(2)} Fee</span>
            </div>
          )}
        </div>

        {/* Date Selection */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">
            Appointment Date *
          </label>
          <input
            type="date"
            min={new Date().toISOString().split('T')[0]}
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setSelectedSlot(null);
            }}
            className="w-full h-10 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-900 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
            required
          />
        </div>

        {/* Available Slots Grid */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider flex items-center justify-between">
            <span>Available Time Slots *</span>
            {slotsData?.dayOfWeek && (
              <span className="text-[11px] font-normal text-gray-500 capitalize">
                Shift day: {slotsData.dayOfWeek}
              </span>
            )}
          </label>

          {isLoadingSlots ? (
            <div className="py-6 text-center text-gray-400">Loading available shifts...</div>
          ) : !slotsData?.hasSchedule ? (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px]">
              The doctor does not have an active clinic shift scheduled on {slotsData?.dayOfWeek || 'this day'}. Please choose another date (e.g. Mon, Wed, Fri).
            </div>
          ) : slotsData.slots.length === 0 ? (
            <div className="p-3 rounded-lg bg-gray-100 text-gray-600 text-[11px]">
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
                    className={`py-2 px-1 text-center rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-600/30'
                        : slot.isAvailable
                        ? 'border-emerald-200 bg-emerald-50/50 text-emerald-800 hover:bg-emerald-100 hover:border-emerald-300'
                        : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed line-through'
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

        {/* Reason for Visit */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">
            Reason for Visit / Symptoms
          </label>
          <input
            type="text"
            placeholder="e.g. Persistent headache, routine blood pressure checkup"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full h-10 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-900 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
          />
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={bookMutation.isPending}
            disabled={!selectedSlot}
          >
            Confirm Appointment
          </Button>
        </div>
      </form>
    </Modal>
  );
};
