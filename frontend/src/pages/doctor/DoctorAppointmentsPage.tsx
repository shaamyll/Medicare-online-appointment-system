import React, { useState, useMemo } from 'react';
import {
  FileEdit,
  Calendar,
  Clock,
  Phone,
  CalendarClock,
  AlertCircle,
  RotateCcw,
  Check,
  X,
  Banknote,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { PaymentBadge } from '@/components/ui/PaymentBadge';
import { Modal } from '@/components/ui/Modal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { PageHeader } from '@/components/ui/PageHeader';
import { FilterBar } from '@/components/ui/FilterBar';
import { SearchInput } from '@/components/ui/SearchInput';
import { SegmentedTabs } from '@/components/ui/SegmentedTabs';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  TableHeadSerial,
  TableCellSerial,
  TablePagination,
} from '@/components/ui/Table';
import { useToast } from '@/components/ui/Toast';
import {
  useAppointments,
  useUpdateAppointmentStatus,
  useAddConsultation,
} from '@/features/appointments/hooks/useAppointments';
import { useCollectPayment } from '@/features/payments/hooks/usePayments';
import { Appointment } from '@/features/appointments/types/appointment.types';
import { RejectReasonModal } from '@/features/appointments/components/RejectReasonModal';
import { RescheduleModal } from '@/features/appointments/components/RescheduleModal';

export const DoctorAppointmentsPage: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'requests' | 'upcoming' | 'history'>('requests');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Modals state
  const [rejectingApt, setRejectingApt] = useState<Appointment | null>(null);
  const [reschedulingApt, setReschedulingApt] = useState<Appointment | null>(null);
  const [consultationModalApt, setConsultationModalApt] = useState<Appointment | null>(null);
  const [collectingPaymentApt, setCollectingPaymentApt] = useState<Appointment | null>(null);
  const [diagnosis, setDiagnosis] = useState('');
  const [prescription, setPrescription] = useState('');
  const [consultationNotes, setConsultationNotes] = useState('');

  const { data: appointments, isLoading, isError, refetch } = useAppointments();
  const updateStatusMutation = useUpdateAppointmentStatus();
  const collectPaymentMutation = useCollectPayment();
  const addConsultationMutation = useAddConsultation();

  const allApts = appointments || [];
  const todayStr = new Date().toISOString().split('T')[0];

  const handleApprove = async (apt: Appointment) => {
    try {
      await updateStatusMutation.mutateAsync({ id: apt.id, status: 'approved' });
      toast(`Appointment #${apt.appointmentNumber} for ${apt.patient.name} approved successfully.`, 'success');
    } catch (err: any) {
      toast(err?.response?.data?.message || err.message || 'Failed to approve appointment', 'error');
    }
  };

  const handleRejectConfirm = async (reason?: string) => {
    if (!rejectingApt) return;
    try {
      await updateStatusMutation.mutateAsync({
        id: rejectingApt.id,
        status: 'rejected',
        reason,
      });
      toast(`Appointment #${rejectingApt.appointmentNumber} rejected.`, 'success');
      setRejectingApt(null);
    } catch (err: any) {
      toast(err?.response?.data?.message || err.message || 'Failed to reject appointment', 'error');
      throw err;
    }
  };

  const openConsultationModal = (apt: Appointment) => {
    setConsultationModalApt(apt);
    setDiagnosis(apt.consultation?.diagnosis || '');
    setPrescription(apt.consultation?.prescription || '');
    setConsultationNotes(apt.consultation?.consultationNotes || '');
  };

  const handleSaveConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consultationModalApt) return;

    if (!diagnosis.trim()) {
      toast('Please enter a clinical diagnosis.', 'error');
      return;
    }

    try {
      await addConsultationMutation.mutateAsync({
        id: consultationModalApt.id,
        data: { diagnosis, prescription, consultationNotes },
      });
      toast('Consultation record and prescription saved successfully!', 'success');
      setConsultationModalApt(null);
    } catch (err: any) {
      toast(err?.response?.data?.message || err.message || 'Failed to save consultation', 'error');
    }
  };

  const pendingCount = allApts.filter((a) => a.status.toUpperCase() === 'PENDING').length;
  const upcomingCount = allApts.filter(
    (a) => (a.status.toUpperCase() === 'APPROVED' || a.status.toUpperCase() === 'CONFIRMED') && a.appointmentDate >= todayStr
  ).length;

  const filteredByTab = useMemo(() => {
    return allApts.filter((apt) => {
      const st = apt.status.toUpperCase();
      if (activeTab === 'requests') {
        return st === 'PENDING';
      } else if (activeTab === 'upcoming') {
        return (st === 'APPROVED' || st === 'CONFIRMED') && apt.appointmentDate >= todayStr;
      } else {
        return st === 'COMPLETED' || st === 'CANCELLED' || st === 'REJECTED' || apt.appointmentDate < todayStr;
      }
    });
  }, [allApts, activeTab, todayStr]);

  const displayedApts = useMemo(() => {
    if (!searchTerm.trim()) return filteredByTab;
    const term = searchTerm.toLowerCase();
    return filteredByTab.filter(
      (apt) =>
        apt.appointmentNumber.toLowerCase().includes(term) ||
        apt.patient.name.toLowerCase().includes(term) ||
        (apt.patient.phone && apt.patient.phone.includes(term)) ||
        (apt.patient.email && apt.patient.email.toLowerCase().includes(term))
    );
  }, [filteredByTab, searchTerm]);

  const totalPages = Math.ceil(displayedApts.length / pageSize) || 1;
  const paginatedApts = displayedApts.slice((page - 1) * pageSize, page * pageSize);

  const tabs = [
    { id: 'requests', label: 'Pending Requests', count: pendingCount },
    { id: 'upcoming', label: 'Upcoming Visits', count: upcomingCount },
    { id: 'history', label: 'Consultation History' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Appointments Management"
        subtitle="Review incoming consultation requests, reschedule shifts, and manage patient prescriptions"
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
          <div className="w-full sm:max-w-md">
            <SearchInput
              value={searchTerm}
              onChange={(val) => {
                setSearchTerm(val);
                setPage(1);
              }}
              placeholder="Search by patient name, phone, or appointment #..."
            />
          </div>
        </FilterBar>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs animate-pulse space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-gray-200" />
                <div className="space-y-1.5">
                  <div className="w-36 h-4 bg-gray-200 rounded" />
                  <div className="w-24 h-3 bg-gray-100 rounded" />
                </div>
              </div>
              <div className="w-28 h-5 bg-gray-200 rounded-full" />
              <div className="w-20 h-5 bg-gray-100 rounded-full" />
              <div className="w-32 h-8 bg-gray-200 rounded-lg" />
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="p-8 text-center bg-white rounded-xl border border-rose-200 shadow-xs space-y-3">
          <AlertCircle className="h-10 w-10 text-rose-500 mx-auto" />
          <h3 className="text-base font-bold text-gray-900">Failed to load appointments</h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            An error occurred while fetching your appointments. Please check your connection and try again.
          </p>
          <Button variant="secondary" size="sm" onClick={() => refetch()} leftIcon={<RotateCcw className="h-4 w-4" />}>
            Retry
          </Button>
        </div>
      )}

      {/* Content Table */}
      {!isLoading && !isError && (
        <div className="space-y-4">
          {displayedApts.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs">
              <EmptyState
                title={
                  searchTerm
                    ? 'No Matching Appointments'
                    : activeTab === 'requests'
                    ? 'No Pending Requests'
                    : activeTab === 'upcoming'
                    ? 'No Upcoming Consultations'
                    : 'No Consultation History'
                }
                description={
                  searchTerm
                    ? 'Try adjusting your search criteria to find what you are looking for.'
                    : activeTab === 'requests'
                    ? 'You have zero pending patient requests awaiting confirmation at this time.'
                    : activeTab === 'upcoming'
                    ? 'No confirmed upcoming appointments are scheduled on your calendar.'
                    : 'Your completed or archived consultations will appear here.'
                }
              />
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHeadSerial />
                    <TableHead>Reference #</TableHead>
                    <TableHead>Patient Details</TableHead>
                    <TableHead>Schedule</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedApts.map((apt, idx) => {
                    const st = apt.status.toUpperCase();
                    const canReschedule = st === 'PENDING' || st === 'APPROVED' || st === 'CONFIRMED';
                    const isUpcoming = (st === 'APPROVED' || st === 'CONFIRMED') && apt.appointmentDate >= todayStr;

                    return (
                      <TableRow key={apt.id}>
                        <TableCellSerial index={(page - 1) * pageSize + idx} />
                        <TableCell className="font-mono text-xs font-bold text-gray-800">
                          <div>{apt.appointmentNumber}</div>
                          {apt.rescheduleCount && apt.rescheduleCount > 0 ? (
                            <span className="inline-block mt-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                              Rescheduled ({apt.rescheduleCount})
                            </span>
                          ) : null}
                        </TableCell>

                        <TableCell>
                          <div className="flex items-start gap-2.5">
                            <Avatar name={apt.patient.name} size="sm" shape="circle" />
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <p className="font-semibold text-gray-900 text-xs sm:text-sm">{apt.patient.name}</p>
                                {apt.patient.age !== undefined && apt.patient.age !== null && (
                                  <span className="text-[10px] font-semibold text-gray-600 bg-gray-100 border border-gray-200 px-1.5 py-0.2 rounded-md">
                                    {apt.patient.age}y{apt.patient.gender ? ` • ${apt.patient.gender}` : ''}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5 text-[11px] text-gray-500">
                                <span>{apt.patient.email}</span>
                                {apt.patient.phone && (
                                  <>
                                    <span>&bull;</span>
                                    <span className="flex items-center gap-1 text-emerald-700 font-medium">
                                      <Phone className="h-3 w-3" />
                                      {apt.patient.phone}
                                    </span>
                                  </>
                                )}
                              </div>
                              {apt.reasonForVisit && (
                                <p className="text-[11px] text-gray-500 mt-1 italic max-w-xs truncate">
                                  "{apt.reasonForVisit}"
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900">
                              <Calendar className="h-3.5 w-3.5 text-gray-400" />
                              <span>{apt.appointmentDate}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-semibold">
                              <Clock className="h-3 w-3 text-emerald-600" />
                              <span>{apt.startTime} - {apt.endTime}</span>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <PaymentBadge
                            status={
                              apt.payment_state ||
                              apt.paymentState ||
                              (apt.status === 'PENDING' && apt.payment?.status !== 'paid'
                                ? 'awaiting_approval'
                                : apt.payment?.status)
                            }
                          />
                          {apt.payment?.method && (
                            <span className="block text-[10px] text-gray-400 capitalize mt-0.5">
                              via {apt.payment.method === 'clinic' ? 'pay at clinic' : apt.payment.method}
                            </span>
                          )}
                        </TableCell>

                        <TableCell>
                          <StatusBadge status={apt.status} />
                          {apt.rejectionReason && (
                            <p className="text-[10px] text-rose-600 mt-1 max-w-[180px] line-clamp-2">
                              Reason: {apt.rejectionReason}
                            </p>
                          )}
                        </TableCell>

                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            {/* Pending state actions */}
                            {st === 'PENDING' && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setRejectingApt(apt)}
                                  className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
                                  leftIcon={<X className="h-3.5 w-3.5" />}
                                >
                                  Reject
                                </Button>
                                <Button
                                  size="sm"
                                  variant="primary"
                                  onClick={() => handleApprove(apt)}
                                  isLoading={updateStatusMutation.isPending}
                                  leftIcon={<Check className="h-3.5 w-3.5" />}
                                >
                                  Approve
                                </Button>
                              </>
                            )}

                            {/* Pay at clinic collection action */}
                            {((apt.payment_state === 'pay_at_clinic' ||
                              apt.paymentState === 'pay_at_clinic' ||
                              (apt.payment?.status === 'unpaid' &&
                                (apt.payment?.method === 'clinic' || apt.payment?.method === 'cash'))) &&
                              (st === 'APPROVED' || st === 'COMPLETED')) && (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => setCollectingPaymentApt(apt)}
                                className="text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100"
                                leftIcon={<Banknote className="h-3.5 w-3.5 text-emerald-600" />}
                              >
                                Mark as paid
                              </Button>
                            )}

                            {/* Reschedule option */}
                            {canReschedule && (
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setReschedulingApt(apt)}
                                leftIcon={<CalendarClock className="h-3.5 w-3.5 text-indigo-600" />}
                              >
                                Reschedule
                              </Button>
                            )}

                            {/* Consultation notes / prescription */}
                            {(isUpcoming || st === 'COMPLETED') && (
                              <Button
                                size="sm"
                                variant={apt.consultation ? 'secondary' : 'primary'}
                                onClick={() => openConsultationModal(apt)}
                                leftIcon={<FileEdit className="h-3.5 w-3.5" />}
                              >
                                {apt.consultation ? 'Edit Prescription' : 'Prescription'}
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* Table pagination on bg-gray-50 */}
              <TablePagination
                page={page}
                totalPages={totalPages}
                totalItems={displayedApts.length}
                pageSize={pageSize}
                onPageChange={(p) => setPage(p)}
              />
            </div>
          )}
        </div>
      )}

      {/* Reject Modal */}
      {rejectingApt && (
        <RejectReasonModal
          isOpen={!!rejectingApt}
          onClose={() => setRejectingApt(null)}
          onConfirm={handleRejectConfirm}
          appointmentNumber={rejectingApt.appointmentNumber}
          patientName={rejectingApt.patient.name}
          isLoading={updateStatusMutation.isPending}
        />
      )}

      {/* Reschedule Modal */}
      {reschedulingApt && (
        <RescheduleModal
          isOpen={!!reschedulingApt}
          onClose={() => setReschedulingApt(null)}
          appointment={reschedulingApt}
        />
      )}

      {/* Consultation Modal */}
      {consultationModalApt && (
        <Modal
          isOpen={!!consultationModalApt}
          onClose={() => setConsultationModalApt(null)}
          title={`Clinical Consultation: #${consultationModalApt.appointmentNumber}`}
          description={`Patient: ${consultationModalApt.patient.name} | Date: ${consultationModalApt.appointmentDate}`}
          maxWidth="lg"
        >
          <form onSubmit={handleSaveConsultation} className="space-y-4 pt-2">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Clinical Diagnosis <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Acute Bronchitis, Hypertension Stage 1"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                className="w-full h-10 px-3.5 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-gray-900"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Prescription & Medication Instructions
              </label>
              <textarea
                rows={4}
                placeholder="1. Amoxicillin 500mg - 1 capsule tid x 7 days&#10;2. Paracetamol 500mg - prn for fever"
                value={prescription}
                onChange={(e) => setPrescription(e.target.value)}
                className="w-full p-3 rounded-lg border border-gray-200 text-sm font-mono bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Doctor's Clinical Notes
              </label>
              <textarea
                rows={3}
                placeholder="Patient presented with dry cough and mild fever. Advised bed rest and hydration."
                value={consultationNotes}
                onChange={(e) => setConsultationNotes(e.target.value)}
                className="w-full p-3 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-gray-900"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setConsultationModalApt(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={addConsultationMutation.isPending}
              >
                Save Consultation Record
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Collect Pay-at-Clinic Confirmation Modal */}
      {collectingPaymentApt && (
        <ConfirmModal
          isOpen={!!collectingPaymentApt}
          onClose={() => setCollectingPaymentApt(null)}
          title="Confirm Clinic Payment"
          description={
            <span>
              Confirm that you received{' '}
              <strong className="text-gray-900">
                Rs.{' '}
                {Number(
                  collectingPaymentApt.payment?.amount ??
                    collectingPaymentApt.doctor.consultationFee ??
                    100
                ).toFixed(0)}
              </strong>{' '}
              from <strong className="text-gray-900">{collectingPaymentApt.patient.name}</strong>?
            </span>
          }
          confirmLabel="Mark as Paid"
          variant="primary"
          isLoading={collectPaymentMutation.isPending}
          onConfirm={async () => {
            try {
              await collectPaymentMutation.mutateAsync(collectingPaymentApt.id);
              toast('Payment marked as collected successfully', 'success');
              setCollectingPaymentApt(null);
            } catch (err: any) {
              toast(err?.response?.data?.message || err?.message || 'Failed to mark payment', 'error');
            }
          }}
        />
      )}
    </div>
  );
};
