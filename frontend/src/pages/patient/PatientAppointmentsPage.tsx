import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Clock,
  CreditCard,
  CalendarClock,
  Star,
  FileText,
  Receipt,
  AlertCircle,
  Pencil,
  Trash2,
  Lock,
  Compass,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { PaymentBadge } from '@/components/ui/PaymentBadge';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';
import { FilterBar } from '@/components/ui/FilterBar';
import { SearchInput } from '@/components/ui/SearchInput';
import { Select } from '@/components/ui/Select';
import { SegmentedTabs } from '@/components/ui/SegmentedTabs';
import { TablePagination } from '@/components/ui/Table';
import { useToast } from '@/components/ui/Toast';
import { useAppointments, useCancelAppointment } from '@/features/appointments/hooks/useAppointments';
import { RescheduleModal } from '@/features/appointments/components/RescheduleModal';
import { PaymentModal } from '@/features/payments/components/PaymentModal';
import { ReceiptModal } from '@/features/payments/components/ReceiptModal';
import { FeedbackModal } from '@/features/feedback/components/FeedbackModal';
import { StarRating } from '@/features/feedback/components/StarRating';
import { useDeleteAppointmentFeedback } from '@/features/feedback/hooks/useFeedback';
import { Appointment } from '@/features/appointments/types/appointment.types';

export const PatientAppointmentsPage: React.FC = () => {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = searchParams.get('tab');
  const rateParam = searchParams.get('rate');

  const [activeTab, setActiveTab] = useState<'upcoming' | 'history' | 'all'>(
    tabParam === 'history' ? 'history' : tabParam === 'all' ? 'all' : 'upcoming'
  );
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const pageSize = 6;

  // Modal target states
  const [rescheduleAppointment, setRescheduleAppointment] = useState<Appointment | null>(null);
  const [paymentAppointment, setPaymentAppointment] = useState<Appointment | null>(null);
  const [receiptAppointmentId, setReceiptAppointmentId] = useState<number | null>(null);
  const [feedbackAppointment, setFeedbackAppointment] = useState<Appointment | null>(null);
  const [deletingFeedbackAptId, setDeletingFeedbackAptId] = useState<number | null>(null);
  const [notesAppointment, setNotesAppointment] = useState<Appointment | null>(null);
  const [cancellingAppointment, setCancellingAppointment] = useState<Appointment | null>(null);

  const { data: appointments, isLoading, isError, refetch } = useAppointments();
  const cancelMutation = useCancelAppointment();
  const deleteFeedbackMutation = useDeleteAppointmentFeedback();

  // Keep activeTab in sync if URL tab changes
  useEffect(() => {
    if (tabParam === 'history' && activeTab !== 'history') {
      setActiveTab('history');
    }
  }, [tabParam, activeTab]);

  // Reset to page 1 whenever appointment count increases (e.g. after booking)
  const prevCountRef = useRef<number>(appointments?.length ?? 0);
  useEffect(() => {
    if (appointments && appointments.length > prevCountRef.current) {
      setPage(1);
    }
    prevCountRef.current = appointments?.length ?? 0;
  }, [appointments]);

  // Handle ?rate={id} deep link from notifications
  const autoRateOpenedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!rateParam || !appointments || appointments.length === 0) return;
    if (autoRateOpenedRef.current === rateParam) return;

    const targetApt = appointments.find((a) => String(a.id) === String(rateParam));
    if (targetApt) {
      autoRateOpenedRef.current = rateParam;
      setActiveTab('history');
      setFeedbackAppointment(targetApt);

      // Scroll to element if present
      setTimeout(() => {
        const el = document.getElementById(`appointment-card-${targetApt.id}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 200);
    }
  }, [rateParam, appointments]);

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

  const handleConfirmDeleteFeedback = async () => {
    if (!deletingFeedbackAptId) return;
    try {
      await deleteFeedbackMutation.mutateAsync(deletingFeedbackAptId);
      toast('Review removed successfully', 'info');
      setDeletingFeedbackAptId(null);
    } catch (err: any) {
      toast(err?.response?.data?.message || err?.message || 'Failed to delete review', 'error');
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const allApts = appointments || [];

  const upcomingApts = useMemo(
    () =>
      allApts.filter(
        (a) =>
          (a.status === 'PENDING' || a.status === 'APPROVED' || a.status === 'CONFIRMED') &&
          a.appointmentDate >= todayStr
      ),
    [allApts, todayStr]
  );

  const historyApts = useMemo(
    () =>
      allApts.filter(
        (a) =>
          a.status === 'COMPLETED' ||
          a.status === 'CANCELLED' ||
          a.status === 'REJECTED' ||
          a.appointmentDate < todayStr
      ),
    [allApts, todayStr]
  );

  const filteredApts = useMemo(() => {
    let list =
      activeTab === 'upcoming'
        ? upcomingApts
        : activeTab === 'history'
          ? historyApts
          : allApts;

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (a) =>
          a.doctor.name.toLowerCase().includes(q) ||
          a.doctor.specialization.toLowerCase().includes(q) ||
          a.appointmentNumber.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== 'all') {
      list = list.filter((a) => a.status.toLowerCase() === statusFilter.toLowerCase());
    }

    return list;
  }, [activeTab, upcomingApts, historyApts, allApts, search, statusFilter]);

  const totalPages = Math.ceil(filteredApts.length / pageSize) || 1;
  const paginatedApts = filteredApts.slice((page - 1) * pageSize, page * pageSize);

  const tabs = [
    { id: 'upcoming', label: 'Upcoming', count: upcomingApts.length },
    { id: 'history', label: 'Past Visits', count: historyApts.length },
    { id: 'all', label: 'All Records', count: allApts.length },
  ];

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'pending', label: 'Pending', dot: 'bg-amber-500' },
    { value: 'approved', label: 'Approved', dot: 'bg-emerald-500' },
    { value: 'completed', label: 'Completed', dot: 'bg-blue-500' },
    { value: 'rejected', label: 'Rejected', dot: 'bg-rose-500' },
    { value: 'cancelled', label: 'Cancelled', dot: 'bg-gray-400' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header - No "Book New Appointment" button per specification */}
      <PageHeader
        title="My Appointments"
        subtitle="Manage your scheduled clinic visits, complete payments, reschedule, and submit feedback"
      />

      {/* Tabs & Toolbar */}
      <div className="space-y-4">
        <SegmentedTabs
          tabs={tabs}
          activeTab={activeTab}
          onChange={(tab) => {
            setActiveTab(tab as any);
            setPage(1);
          }}
        />

        <FilterBar>
          <div className="flex-1 min-w-[220px]">
            <SearchInput
              value={search}
              onChange={(val) => {
                setSearch(val);
                setPage(1);
              }}
              placeholder="Search by doctor, specialization, or appointment #..."
            />
          </div>

          <div className="w-full sm:w-48">
            <Select
              value={statusFilter}
              onChange={(val) => {
                setStatusFilter(val);
                setPage(1);
              }}
              options={statusOptions}
              placeholder="Filter by status"
            />
          </div>
        </FilterBar>
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs animate-pulse flex flex-col md:flex-row gap-5 items-center"
            >
              <div className="w-20 h-20 bg-gray-200 rounded-lg shrink-0" />
              <div className="flex-1 space-y-3 w-full">
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-3 bg-gray-200 rounded w-1/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="bg-white rounded-xl border border-rose-200 p-8 text-center space-y-3 shadow-xs">
          <AlertCircle className="h-10 w-10 text-rose-500 mx-auto" />
          <h3 className="text-base font-bold text-gray-900">Failed to load appointments</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            We encountered an issue fetching your appointments list. Please check your network and retry.
          </p>
          <Button variant="secondary" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : filteredApts.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center shadow-xs">
          <EmptyState
            title={
              search || statusFilter !== 'all'
                ? 'No Matching Appointments'
                : activeTab === 'upcoming'
                  ? 'No Upcoming Appointments'
                  : 'No Past Appointment History'
            }
            description={
              search || statusFilter !== 'all'
                ? 'Try clearing your search query or switching filters to see more results.'
                : activeTab === 'upcoming'
                  ? "You don't have any pending or confirmed consultations on schedule."
                  : 'Your completed and past appointment records will be safely archived here for your reference.'
            }
            actionLabel={
              search || statusFilter !== 'all' ? 'Clear Filters' : undefined
            }
            onAction={
              search || statusFilter !== 'all'
                ? () => {
                  setSearch('');
                  setStatusFilter('all');
                }
                : undefined
            }
          />
          {activeTab === 'upcoming' && !search && statusFilter === 'all' && (
            <div className="mt-4">
              <Link
                to="/dashboard/doctors"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
              >
                <Compass className="h-4 w-4" />
                Find a doctor to schedule a visit &rarr;
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {paginatedApts.map((apt) => {
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

            // Review / Feedback logic
            const reviewData = apt.review || apt.feedback;
            const hasReview = isCompleted && Boolean(reviewData && reviewData.rating);
            const canRate = isCompleted && !hasReview;

            // 7-day edit/delete window
            let isReviewEditable = false;
            if (hasReview && reviewData) {
              if (reviewData.isEditable !== undefined) {
                isReviewEditable = reviewData.isEditable;
              } else if (reviewData.createdAt) {
                const createdTs = new Date(reviewData.createdAt).getTime();
                const nowTs = Date.now();
                isReviewEditable = nowTs - createdTs <= 7 * 24 * 60 * 60 * 1000;
              }
            }

            return (
              <div
                key={apt.id}
                id={`appointment-card-${apt.id}`}
                className="bg-white rounded-xl border border-gray-200 shadow-xs hover:shadow-md transition-shadow overflow-hidden"
              >
                {/* Main Card Content */}
                <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-5">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1">
                    {/* Standardized Date/Time Block in bg-gray-50 */}
                    <div className="w-20 h-20 rounded-lg bg-gray-50 border border-gray-200 text-gray-800 flex flex-col items-center justify-center shrink-0 shadow-2xs select-none">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500">
                        {monthStr} {yearNum}
                      </span>
                      <span className="text-2xl font-black text-gray-900 leading-none my-0.5">
                        {dayNum}
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-700">{weekday}</span>
                    </div>

                    {/* Doctor Details */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-mono font-bold text-gray-500 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-md">
                          #{apt.appointmentNumber}
                        </span>
                        {apt.rescheduleCount && apt.rescheduleCount > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                            <CalendarClock className="h-3 w-3" />
                            Rescheduled ({apt.rescheduleCount})
                          </span>
                        ) : null}
                      </div>

                      <h3 className="text-base font-bold text-gray-900 tracking-tight">
                        Dr. {apt.doctor.name}
                      </h3>

                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-semibold text-emerald-700">
                          {apt.doctor.specialization}
                        </span>
                        <span className="text-gray-300">&bull;</span>
                        <span className="text-gray-500">{apt.doctor.department}</span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-gray-600 pt-0.5">
                        <Clock className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                        <span className="font-semibold text-gray-700">
                          {apt.startTime} - {apt.endTime}
                        </span>
                        <span className="text-gray-300">&bull;</span>
                        <span className="font-bold text-emerald-700">
                          Rs. {Number(fee).toFixed(0)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Approval & payment status, stacked */}
                  <div className="w-full md:w-52 shrink-0 self-start md:self-center rounded-lg border border-gray-100 bg-gray-50/60 divide-y divide-gray-100">
                    <div className="flex items-center justify-between gap-3 px-3 py-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                        Approval
                      </span>
                      <StatusBadge
                        status={apt.status}
                        showHelper
                        rejectionReason={apt.rejectionReason}
                      />
                    </div>
                    <div className="flex items-center justify-between gap-3 px-3 py-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                        Payment
                      </span>
                      <PaymentBadge status={paymentStatus} />
                    </div>
                  </div>
                </div>

                {/* Feedback Display Strip for Completed Appointments with Review */}
                {isCompleted && hasReview && reviewData && (
                  <div className="bg-amber-50/60 border-t border-amber-100 px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <StarRating value={reviewData.rating} readOnly size="sm" />
                        <span className="font-bold text-amber-900">Your Rating</span>
                        {reviewData.updatedAt && (
                          <span className="text-[10px] font-medium bg-amber-200/70 text-amber-900 px-1.5 py-0.5 rounded">
                            Edited
                          </span>
                        )}
                        {!isReviewEditable && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-gray-500">
                            <Lock className="h-3 w-3 text-gray-400" />
                            Review locked
                          </span>
                        )}
                      </div>

                      {reviewData.comment && (
                        <p className="text-gray-700 italic line-clamp-2">
                          "{reviewData.comment}"
                        </p>
                      )}

                      {reviewData.tags && reviewData.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {reviewData.tags.map((t, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] font-medium bg-amber-100/90 text-amber-800 border border-amber-200/60 px-2 py-0.5 rounded-full"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 7-day Edit & Delete actions */}
                    {isReviewEditable && (
                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => setFeedbackAppointment(apt)}
                          title="Edit your review"
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-amber-900 bg-white border border-amber-200 rounded-lg hover:bg-amber-50 transition-colors shadow-2xs"
                        >
                          <Pencil className="h-3 w-3" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingFeedbackAptId(apt.id)}
                          title="Delete your review"
                          className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-rose-700 bg-white border border-rose-200 rounded-lg hover:bg-rose-50 transition-colors shadow-2xs"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Footer Strip of Card with bg-gray-50 and top border */}
                <div className="bg-gray-50 border-t border-gray-100 px-5 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-xs text-gray-500 truncate flex-1">
                    {apt.reasonForVisit ? (
                      <span className="italic">
                        Reason: <strong className="font-medium text-gray-700">"{apt.reasonForVisit}"</strong>
                      </span>
                    ) : (
                      <span>Consultation visit</span>
                    )}
                  </div>

                  {/* Right-aligned action buttons */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0 justify-end">
                    {canPay && (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => setPaymentAppointment(apt)}
                        leftIcon={<CreditCard className="h-3.5 w-3.5" />}
                      >
                        Pay Now
                      </Button>
                    )}

                    {isPaid && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setReceiptAppointmentId(apt.id)}
                        leftIcon={<Receipt className="h-3.5 w-3.5 text-emerald-600" />}
                      >
                        Receipt
                      </Button>
                    )}

                    {canReschedule && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setRescheduleAppointment(apt)}
                        leftIcon={<CalendarClock className="h-3.5 w-3.5 text-indigo-600" />}
                      >
                        Reschedule
                      </Button>
                    )}

                    {canCancel && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setCancellingAppointment(apt)}
                        className="text-rose-600 border-rose-200 hover:bg-rose-50"
                      >
                        Cancel
                      </Button>
                    )}

                    {canRate && (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => setFeedbackAppointment(apt)}
                        className="bg-amber-500 hover:bg-amber-600"
                        leftIcon={<Star className="h-3.5 w-3.5 fill-current" />}
                      >
                        Rate your visit
                      </Button>
                    )}

                    {apt.consultation && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setNotesAppointment(apt)}
                        leftIcon={<FileText className="h-3.5 w-3.5 text-teal-600" />}
                      >
                        Prescription
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Pagination bar on bg-gray-50 */}
          {totalPages > 1 && (
            <div className="rounded-xl border border-gray-200 overflow-hidden bg-white shadow-xs">
              <TablePagination
                page={page}
                totalPages={totalPages}
                totalItems={filteredApts.length}
                pageSize={pageSize}
                onPageChange={(p) => setPage(p)}
              />
            </div>
          )}
        </div>
      )}

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

      {/* Feedback Modal (Create & Edit) */}
      {feedbackAppointment && (
        <FeedbackModal
          isOpen={!!feedbackAppointment}
          onClose={() => {
            setFeedbackAppointment(null);
            // Clear rate param if it was set
            if (searchParams.get('rate')) {
              searchParams.delete('rate');
              setSearchParams(searchParams, { replace: true });
            }
          }}
          appointmentId={feedbackAppointment.id}
          doctorName={feedbackAppointment.doctor.name}
          specialization={feedbackAppointment.doctor.specialization}
          doctorPhoto={feedbackAppointment.doctor.thumbnailPath || feedbackAppointment.doctor.imagePath}
          visitDate={feedbackAppointment.appointmentDate}
          initialReview={feedbackAppointment.review || feedbackAppointment.feedback}
          onSuccess={() => {
            refetch();
          }}
        />
      )}

      {/* Delete Feedback Confirmation Modal */}
      <ConfirmModal
        isOpen={deletingFeedbackAptId !== null}
        onClose={() => setDeletingFeedbackAptId(null)}
        onConfirm={handleConfirmDeleteFeedback}
        title="Delete Review"
        description="Are you sure you want to remove your feedback and rating for this appointment? This action cannot be undone."
        confirmLabel="Yes, Delete Review"
        variant="danger"
        isLoading={deleteFeedbackMutation.isPending}
      />

      {/* Consultation Notes Modal */}
      {notesAppointment && (
        <Modal
          isOpen={!!notesAppointment}
          onClose={() => setNotesAppointment(null)}
          title="Clinical Consultation & Prescription"
          maxWidth="md"
        >
          <div className="space-y-4 pt-1">
            <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between text-xs">
              <div>
                <p className="font-bold text-gray-900">Dr. {notesAppointment.doctor.name}</p>
                <p className="text-emerald-700 font-semibold">{notesAppointment.doctor.specialization}</p>
              </div>
              <div className="text-right">
                <p className="text-gray-400">Date</p>
                <p className="font-bold text-gray-700">{notesAppointment.appointmentDate}</p>
              </div>
            </div>

            {notesAppointment.consultation?.diagnosis && (
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Diagnosis
                </h4>
                <div className="p-3.5 rounded-xl bg-gray-50 text-gray-800 text-xs sm:text-sm font-medium border border-gray-200">
                  {notesAppointment.consultation.diagnosis}
                </div>
              </div>
            )}

            {notesAppointment.consultation?.prescription && (
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Prescription / Medications
                </h4>
                <div className="p-3.5 rounded-xl bg-emerald-50/60 text-emerald-900 text-xs sm:text-sm font-mono border border-emerald-100 whitespace-pre-line">
                  {notesAppointment.consultation.prescription}
                </div>
              </div>
            )}

            {notesAppointment.consultation?.consultationNotes && (
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Doctor's Clinical Notes
                </h4>
                <div className="p-3.5 rounded-xl bg-gray-50 text-gray-700 text-xs sm:text-sm leading-relaxed border border-gray-200">
                  {notesAppointment.consultation.consultationNotes}
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <Button variant="secondary" onClick={() => setNotesAppointment(null)}>
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
