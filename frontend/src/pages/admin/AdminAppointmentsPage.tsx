import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  RotateCcw,
  AlertCircle,
  Eye,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { PaymentBadge } from '@/components/ui/PaymentBadge';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';
import { FilterBar } from '@/components/ui/FilterBar';
import { SearchInput } from '@/components/ui/SearchInput';
import { Select } from '@/components/ui/Select';
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
import { useAppointments, useCancelAppointment } from '@/features/appointments/hooks/useAppointments';
import { useDoctors } from '@/features/doctors/hooks/useDoctors';
import { Appointment } from '@/features/appointments/types/appointment.types';

export const AdminAppointmentsPage: React.FC = () => {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [doctorFilter, setDoctorFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  const { data: doctorsData } = useDoctors();
  const doctorsList = doctorsData || [];

  const { data: appointments, isLoading, isError, refetch } = useAppointments({
    status: statusFilter || undefined,
    date: dateFilter || undefined,
    doctorId: doctorFilter ? Number(doctorFilter) : undefined,
  });

  const cancelMutation = useCancelAppointment();

  const handleCancel = async (id: number) => {
    if (!window.confirm('Are you sure you want to cancel this appointment? Any paid amount will be marked refunded.')) {
      return;
    }
    try {
      await cancelMutation.mutateAsync({ id, reason: 'Administrative cancellation' });
      toast('Appointment cancelled and patient notified', 'info');
      setSelectedAppointment(null);
    } catch (err: any) {
      toast(err?.response?.data?.message || err.message || 'Failed to cancel appointment', 'error');
    }
  };

  const allAppointments = appointments || [];

  const filteredAppointments = useMemo(() => {
    if (!searchTerm.trim()) return allAppointments;
    const term = searchTerm.toLowerCase();
    return allAppointments.filter(
      (apt) =>
        apt.appointmentNumber.toLowerCase().includes(term) ||
        apt.patient.name.toLowerCase().includes(term) ||
        apt.doctor.name.toLowerCase().includes(term) ||
        (apt.doctor.department && apt.doctor.department.toLowerCase().includes(term)) ||
        (apt.payment?.transactionRef && apt.payment.transactionRef.toLowerCase().includes(term))
    );
  }, [allAppointments, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredAppointments.length / itemsPerPage));
  const currentPage = Math.min(page, totalPages);
  const paginatedAppointments = filteredAppointments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const resetFilters = () => {
    setStatusFilter('');
    setDateFilter('');
    setDoctorFilter('');
    setSearchTerm('');
    setPage(1);
  };

  const hasActiveFilters = Boolean(statusFilter || dateFilter || doctorFilter || searchTerm);

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'pending', label: 'Pending', dot: 'bg-amber-500' },
    { value: 'approved', label: 'Approved', dot: 'bg-emerald-500' },
    { value: 'completed', label: 'Completed', dot: 'bg-blue-500' },
    { value: 'rejected', label: 'Rejected', dot: 'bg-rose-500' },
    { value: 'cancelled', label: 'Cancelled', dot: 'bg-gray-400' },
  ];

  const doctorOptions = useMemo(() => {
    const list = [{ value: '', label: 'All Doctors' }];
    doctorsList.forEach((doc) => {
      list.push({
        value: String(doc.id),
        label: `Dr. ${doc.user?.name || (doc as any).name}`,
      });
    });
    return list;
  }, [doctorsList]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Platform Appointments & Consultations"
        subtitle="Comprehensive appointment ledger, consultation payments, and provider scheduling records"
      />

      {/* Filter Bar */}
      <FilterBar
        actions={
          hasActiveFilters ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="text-xs text-rose-600 hover:text-rose-700"
            >
              Reset Filters
            </Button>
          ) : undefined
        }
      >
        <div className="flex-1 min-w-[220px]">
          <SearchInput
            value={searchTerm}
            onChange={(val) => {
              setSearchTerm(val);
              setPage(1);
            }}
            placeholder="Search ref, patient, doctor..."
          />
        </div>

        <div className="w-full sm:w-44">
          <Select
            value={statusFilter}
            onChange={(val) => {
              setStatusFilter(val);
              setPage(1);
            }}
            options={statusOptions}
            placeholder="All Statuses"
          />
        </div>

        <div className="w-full sm:w-52">
          <Select
            value={doctorFilter}
            onChange={(val) => {
              setDoctorFilter(val);
              setPage(1);
            }}
            options={doctorOptions}
            searchable
            placeholder="All Doctors"
          />
        </div>

        <div className="w-full sm:w-44">
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value);
              setPage(1);
            }}
            className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-2xs"
          />
        </div>
      </FilterBar>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs animate-pulse space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
              <div className="w-24 h-4 bg-gray-200 rounded" />
              <div className="w-36 h-4 bg-gray-200 rounded" />
              <div className="w-32 h-4 bg-gray-200 rounded" />
              <div className="w-24 h-4 bg-gray-100 rounded" />
              <div className="w-20 h-5 bg-gray-200 rounded-full" />
              <div className="w-20 h-5 bg-gray-100 rounded-full" />
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
            An error occurred while fetching the appointment ledger.
          </p>
          <Button variant="secondary" size="sm" onClick={() => refetch()} leftIcon={<RotateCcw className="h-4 w-4" />}>
            Retry
          </Button>
        </div>
      )}

      {/* Main Table */}
      {!isLoading && !isError && (
        <div className="space-y-4">
          {filteredAppointments.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs">
              <EmptyState
                title="No Appointments Found"
                description={
                  hasActiveFilters
                    ? 'No appointments match the selected filter criteria. Try resetting or adjusting your filters.'
                    : 'There are no appointment records registered in the system.'
                }
                actionLabel={hasActiveFilters ? 'Reset Filters' : undefined}
                onAction={hasActiveFilters ? resetFilters : undefined}
              />
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHeadSerial />
                    <TableHead>Reference #</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Assigned Doctor</TableHead>
                    <TableHead>Date & Slot</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedAppointments.map((apt, idx) => {
                    const serialIndex = (currentPage - 1) * itemsPerPage + idx;
                    return (
                      <TableRow key={apt.id}>
                        <TableCellSerial index={serialIndex} />
                        <TableCell className="font-mono text-xs font-bold text-gray-800">
                          <div>{apt.appointmentNumber}</div>
                          {apt.rescheduleCount && apt.rescheduleCount > 0 ? (
                            <span className="inline-block mt-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                              Rescheduled ({apt.rescheduleCount})
                            </span>
                          ) : null}
                        </TableCell>

                        <TableCell>
                          <p className="font-semibold text-gray-900 text-xs sm:text-sm">{apt.patient.name}</p>
                          <p className="text-[11px] text-gray-400">{apt.patient.email}</p>
                          {apt.patient.phone && (
                            <p className="text-[11px] text-emerald-700 font-medium">{apt.patient.phone}</p>
                          )}
                        </TableCell>

                        <TableCell>
                          <p className="font-medium text-gray-800 text-xs">Dr. {apt.doctor.name}</p>
                          <p className="text-[11px] text-gray-500">
                            {apt.doctor.specialization} &bull; {apt.doctor.department || 'General'}
                          </p>
                        </TableCell>

                        <TableCell>
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-900">
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
                          <PaymentBadge status={apt.payment?.status} />
                          {apt.payment?.amount && (
                            <span className="block text-[10px] text-gray-500 font-medium mt-0.5">
                              Rs. {Number(apt.payment.amount).toFixed(0)}
                            </span>
                          )}
                        </TableCell>

                        <TableCell>
                          <StatusBadge status={apt.status} />
                          {apt.rejectionReason && (
                            <p className="text-[10px] text-rose-600 mt-1 max-w-[140px] truncate" title={apt.rejectionReason}>
                              {apt.rejectionReason}
                            </p>
                          )}
                        </TableCell>

                        <TableCell className="text-right">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setSelectedAppointment(apt)}
                            leftIcon={<Eye className="h-3.5 w-3.5 text-gray-500" />}
                          >
                            Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* Pagination */}
              <TablePagination
                page={currentPage}
                totalPages={totalPages}
                totalItems={filteredAppointments.length}
                pageSize={itemsPerPage}
                onPageChange={(p) => setPage(p)}
              />
            </div>
          )}
        </div>
      )}

      {/* Appointment Detail Modal */}
      {selectedAppointment && (
        <Modal
          isOpen={!!selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
          title={`Appointment #${selectedAppointment.appointmentNumber}`}
          maxWidth="lg"
        >
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Patient</span>
                <p className="font-bold text-gray-900 text-sm">{selectedAppointment.patient.name}</p>
                <p className="text-xs text-gray-600">{selectedAppointment.patient.email}</p>
                {selectedAppointment.patient.phone && (
                  <p className="text-xs text-emerald-700 font-medium">{selectedAppointment.patient.phone}</p>
                )}
              </div>

              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Attending Physician</span>
                <p className="font-bold text-gray-900 text-sm">Dr. {selectedAppointment.doctor.name}</p>
                <p className="text-xs text-gray-600">{selectedAppointment.doctor.specialization}</p>
                <p className="text-xs text-gray-500">{selectedAppointment.doctor.department || 'General'}</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Date</span>
                <span className="font-bold text-gray-800">{selectedAppointment.appointmentDate}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Time Slot</span>
                <span className="font-bold text-emerald-700">
                  {selectedAppointment.startTime} - {selectedAppointment.endTime}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Status</span>
                <div className="mt-0.5">
                  <StatusBadge status={selectedAppointment.status} />
                </div>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Payment</span>
                <div className="mt-0.5">
                  <PaymentBadge status={selectedAppointment.payment?.status} />
                </div>
              </div>
            </div>

            {selectedAppointment.reasonForVisit && (
              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                  Reason for Visit
                </span>
                <p className="text-xs text-gray-700 italic">"{selectedAppointment.reasonForVisit}"</p>
              </div>
            )}

            {selectedAppointment.consultation && (
              <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-100 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                  Clinical Diagnosis & Prescription
                </span>
                <p className="text-xs font-semibold text-gray-900">
                  Diagnosis: {selectedAppointment.consultation.diagnosis}
                </p>
                {selectedAppointment.consultation.prescription && (
                  <p className="text-xs font-mono text-emerald-900 bg-white p-2.5 rounded-lg border border-emerald-200 whitespace-pre-line">
                    {selectedAppointment.consultation.prescription}
                  </p>
                )}
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              {(selectedAppointment.status.toLowerCase() === 'pending' ||
                selectedAppointment.status.toLowerCase() === 'approved') && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleCancel(selectedAppointment.id)}
                  isLoading={cancelMutation.isPending}
                  className="text-rose-600 border-rose-200 hover:bg-rose-50"
                  leftIcon={<XCircle className="h-4 w-4" />}
                >
                  Cancel Appointment
                </Button>
              )}

              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setSelectedAppointment(null)}
                className="ml-auto"
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
