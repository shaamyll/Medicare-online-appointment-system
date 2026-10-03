import React, { useState } from 'react';
import {
  PlusCircle,
  Clock,
  CreditCard,
  CalendarClock,
  Star,
  FileText,
  Receipt,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { PaymentBadge } from '@/components/ui/PaymentBadge';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { useAppointments, useCancelAppointment } from '@/features/appointments/hooks/useAppointments';
import { AppointmentBookingModal } from '@/features/appointments/components/AppointmentBookingModal';
import { RescheduleModal } from '@/features/appointments/components/RescheduleModal';
import { PaymentModal } from '@/features/payments/components/PaymentModal';
import { ReceiptModal } from '@/features/payments/components/ReceiptModal';
import { FeedbackModal } from '@/features/feedback/components/FeedbackModal';
import { StarRating } from '@/features/feedback/components/StarRating';
import { Appointment } from '@/features/appointments/types/appointment.types';

export const PatientAppointmentsPage: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  // Modal target states
  const [rescheduleAppointment, setRescheduleAppointment] = useState<Appointment | null>(null);
  const [paymentAppointment, setPaymentAppointment] = useState<Appointment | null>(null);
  const [receiptAppointmentId, setReceiptAppointmentId] = useState<number | null>(null);
  const [feedbackAppointment, setFeedbackAppointment] = useState<Appointment | null>(null);
  const [notesAppointment, setNotesAppointment] = useState<Appointment | null>(null);
  const [cancellingAppointment, setCancellingAppointment] = useState<Appointment | null>(null);

  const { data: appointments, isLoading, isError, refetch } = useAppointments();
  const cancelMutation = useCancelAppointment();

  const handleConfirmCancel = async () => {
    if (!cancellingAppointment) return;
    try {
      await cancelMutation.mutateAsync({ id: cancellingAppointment.id });
      toast('Appointment cancelled successfully', 'info');
      setCancellingAppointment(null);
    } catch (err: any) {
      toast(err?.response?.data?.message || err?.message || 'Failed to cancel appointment', 'error');
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const allApts = appointments || [];

  const upcomingApts = allApts.filter(
    (a) =>
      (a.status === 'PENDING' || a.status === 'APPROVED' || a.status === 'CONFIRMED') &&
      a.appointmentDate >= todayStr
  );

  const historyApts = allApts.filter(
    (a) =>
      a.status === 'COMPLETED' ||
      a.status === 'CANCELLED' ||
      a.status === 'REJECTED' ||
      a.appointmentDate < todayStr
  );

  const displayedApts = activeTab === 'upcoming' ? upcomingApts : historyApts;

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">My Appointments</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage your scheduled clinic visits, complete payments, reschedule, and submit feedback
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsBookingOpen(true)}
          className="flex items-center gap-2 shadow-xs"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Book New Appointment</span>
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`pb-3 text-xs sm:text-sm font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === 'upcoming'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Upcoming Appointments</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-800 font-extrabold">
            {upcomingApts.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 text-xs sm:text-sm font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === 'history'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Past Visits & History</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-600 font-extrabold">
            {historyApts.length}
          </span>
        </button>
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="bg-white rounded-2xl border border-slate-200 p-6 animate-pulse flex flex-col md:flex-row gap-6 items-center"
            >
              <div className="w-20 h-20 bg-slate-200 rounded-2xl shrink-0" />
              <div className="flex-1 space-y-3 w-full">
                <div className="h-5 bg-slate-200 rounded w-1/3" />
                <div className="h-4 bg-slate-200 rounded w-1/4" />
                <div className="h-3 bg-slate-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="bg-white rounded-2xl border border-rose-200 p-8 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">Failed to load appointments</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            We encountered an issue fetching your appointments list. Please check your network and retry.
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : displayedApts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center">
          <EmptyState
            title={activeTab === 'upcoming' ? 'No Upcoming Appointments' : 'No Past Appointment History'}
            description={
              activeTab === 'upcoming'
                ? "You don't have any pending or confirmed consultations on schedule. Book your first appointment today."
                : 'Your completed and past appointment records will be safely archived here for your reference.'
            }
            actionLabel={activeTab === 'upcoming' ? 'Book Visit Now' : undefined}
            onAction={activeTab === 'upcoming' ? () => setIsBookingOpen(true) : undefined}
          />
        </div>
      ) : (
        <div className="space-y-4">
          {displayedApts.map((apt) => {
            const dateObj = new Date(apt.appointmentDate);
            const monthStr = dateObj.toLocaleDateString('en-US', { month: 'short' });
            const dayNum = dateObj.getDate();
            const yearNum = dateObj.getFullYear();
            const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'short' });

            const isPending = apt.status === 'PENDING';
            const isApproved = apt.status === 'APPROVED' || apt.status === 'CONFIRMED';
            const isCompleted = apt.status === 'COMPLETED';
            const isRejected = apt.status === 'REJECTED';
            const isCancelled = apt.status === 'CANCELLED';

            const paymentStatus = apt.payment?.status || 'unpaid';
            const isPaid = paymentStatus === 'paid';
            const fee = apt.payment?.amount ?? apt.doctor.consultationFee ?? 0;

            const canPay = !isPaid && !isRejected && !isCancelled;
            const canReschedule = (isPending || isApproved) && (apt.rescheduleCount || 0) < 2;
            const canCancel = isPending || isApproved;
            const canRate = isCompleted && !apt.feedback;
            const hasFeedback = isCompleted && !!apt.feedback;

            return (
              <div
                key={apt.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6"
              >
                {/* Left block: Date/Time Badge + Doctor Info */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5 flex-1">
                  {/* Modern Date Block */}
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex flex-col items-center justify-center shrink-0 shadow-xs select-none">
                    <span className="text-[10px] uppercase font-bold tracking-wider opacity-85">
                      {monthStr} {yearNum}
                    </span>
                    <span className="text-2xl font-black leading-none my-0.5">{dayNum}</span>
                    <span className="text-[10px] font-semibold opacity-90">{weekday}</span>
                  </div>

                  {/* Doctor Details */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        #{apt.appointmentNumber}
                      </span>
                      {apt.rescheduleCount && apt.rescheduleCount > 0 ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                          <CalendarClock className="w-3 h-3" />
                          Rescheduled ({apt.rescheduleCount})
                        </span>
                      ) : null}
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-slate-900">
                      Dr. {apt.doctor.name}
                    </h3>

                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-semibold text-emerald-700">
                        {apt.doctor.specialization}
                      </span>
                      <span className="text-slate-300">&bull;</span>
                      <span className="text-slate-500">{apt.doctor.department}</span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-600 pt-0.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-semibold">{apt.startTime} - {apt.endTime}</span>
                      <span className="text-slate-300">&bull;</span>
                      <span className="font-bold text-slate-800">Rs. {Number(fee).toFixed(0)}</span>
                    </div>

                    {apt.reasonForVisit && (
                      <p className="text-xs text-slate-500 line-clamp-1 italic pt-1">
                        Reason: "{apt.reasonForVisit}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Middle: Badges */}
                <div className="flex flex-row lg:flex-col items-start gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                  <StatusBadge
                    status={apt.status}
                    showHelper
                    rejectionReason={apt.rejectionReason}
                  />
                  <PaymentBadge status={paymentStatus} />
                </div>

                {/* Right: Allowed Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 justify-end">
                  {canPay && (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => setPaymentAppointment(apt)}
                      className="flex items-center gap-1.5"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Pay Now</span>
                    </Button>
                  )}

                  {isPaid && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setReceiptAppointmentId(apt.id)}
                      className="flex items-center gap-1.5 text-xs text-slate-700 border-slate-200 hover:bg-slate-50"
                    >
                      <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Receipt</span>
                    </Button>
                  )}

                  {canReschedule && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setRescheduleAppointment(apt)}
                      className="flex items-center gap-1.5 text-xs text-slate-700 border-slate-200 hover:bg-slate-50"
                    >
                      <CalendarClock className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Reschedule</span>
                    </Button>
                  )}

                  {canCancel && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCancellingAppointment(apt)}
                      className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
                    >
                      Cancel
                    </Button>
                  )}

                  {canRate && (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => setFeedbackAppointment(apt)}
                      className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white"
                    >
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span>Rate Visit</span>
                    </Button>
                  )}

                  {hasFeedback && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50/80 border border-amber-200/70 text-xs">
                      <StarRating value={apt.feedback!.rating} readOnly size="sm" />
                      <span className="text-[11px] font-bold text-amber-800">Your Rating</span>
                    </div>
                  )}

                  {apt.consultation && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setNotesAppointment(apt)}
                      className="flex items-center gap-1.5 text-xs text-teal-700 border-teal-200 hover:bg-teal-50"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Prescription Notes</span>
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Booking Modal */}
      <AppointmentBookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
      />

      {/* Reschedule Modal */}
      {rescheduleAppointment && (
        <RescheduleModal
          isOpen={!!rescheduleAppointment}
          onClose={() => setRescheduleAppointment(null)}
          appointment={rescheduleAppointment}
        />
      )}

      {/* Payment Modal */}
      {paymentAppointment && (
        <PaymentModal
          isOpen={!!paymentAppointment}
          onClose={() => setPaymentAppointment(null)}
          appointmentId={paymentAppointment.id}
          appointmentNumber={paymentAppointment.appointmentNumber}
          amount={paymentAppointment.payment?.amount ?? paymentAppointment.doctor.consultationFee ?? 100}
          doctorName={paymentAppointment.doctor.name}
          specialization={paymentAppointment.doctor.specialization}
          onViewReceipt={() => {
            const id = paymentAppointment.id;
            setPaymentAppointment(null);
            setReceiptAppointmentId(id);
          }}
        />
      )}

      {/* Receipt Modal */}
      {receiptAppointmentId !== null && (
        <ReceiptModal
          isOpen={receiptAppointmentId !== null}
          onClose={() => setReceiptAppointmentId(null)}
          appointmentId={receiptAppointmentId}
        />
      )}

      {/* Feedback Modal */}
      {feedbackAppointment && (
        <FeedbackModal
          isOpen={!!feedbackAppointment}
          onClose={() => setFeedbackAppointment(null)}
          appointmentId={feedbackAppointment.id}
          doctorName={feedbackAppointment.doctor.name}
          specialization={feedbackAppointment.doctor.specialization}
        />
      )}

      {/* Consultation Notes Modal */}
      {notesAppointment && (
        <Modal
          isOpen={!!notesAppointment}
          onClose={() => setNotesAppointment(null)}
          title="Clinical Consultation & Prescription"
          maxWidth="md"
        >
          <div className="space-y-4 pt-1">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
              <div>
                <p className="font-bold text-slate-800">Dr. {notesAppointment.doctor.name}</p>
                <p className="text-emerald-700 font-semibold">{notesAppointment.doctor.specialization}</p>
              </div>
              <div className="text-right">
                <p className="text-slate-400">Date</p>
                <p className="font-bold text-slate-700">{notesAppointment.appointmentDate}</p>
              </div>
            </div>

            {notesAppointment.consultation?.diagnosis && (
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Diagnosis
                </h4>
                <div className="p-3.5 rounded-xl bg-slate-50 text-slate-800 text-xs sm:text-sm font-medium border border-slate-100">
                  {notesAppointment.consultation.diagnosis}
                </div>
              </div>
            )}

            {notesAppointment.consultation?.prescription && (
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Prescription / Medications
                </h4>
                <div className="p-3.5 rounded-xl bg-emerald-50/60 text-emerald-900 text-xs sm:text-sm font-mono border border-emerald-100 whitespace-pre-line">
                  {notesAppointment.consultation.prescription}
                </div>
              </div>
            )}

            {notesAppointment.consultation?.consultationNotes && (
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Doctor's Clinical Notes
                </h4>
                <div className="p-3.5 rounded-xl bg-slate-50 text-slate-700 text-xs sm:text-sm leading-relaxed border border-slate-100">
                  {notesAppointment.consultation.consultationNotes}
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <Button variant="outline" onClick={() => setNotesAppointment(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Cancel Confirmation Modal */}
      <ConfirmModal
        isOpen={!!cancellingAppointment}
        onClose={() => setCancellingAppointment(null)}
        onConfirm={handleConfirmCancel}
        title="Cancel Appointment"
        description={`Are you sure you want to cancel appointment #${cancellingAppointment?.appointmentNumber} with Dr. ${cancellingAppointment?.doctor.name}? If you have completed payment, it will be refunded to you.`}
        confirmLabel="Yes, Cancel Visit"
        variant="danger"
        isLoading={cancelMutation.isPending}
      />
    </div>
  );
};
