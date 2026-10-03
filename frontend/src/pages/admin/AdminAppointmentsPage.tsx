import React, { useState } from 'react';
import {
  Search,
  Calendar,
  Clock,
  Filter,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { PaymentBadge } from '@/components/ui/PaymentBadge';
import { Modal } from '@/components/ui/Modal';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell, TableHeadSerial, TableCellSerial } from '@/components/ui/Table';
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

  const filteredAppointments = allAppointments.filter((apt) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      apt.appointmentNumber.toLowerCase().includes(term) ||
      apt.patient.name.toLowerCase().includes(term) ||
      apt.doctor.name.toLowerCase().includes(term) ||
      (apt.doctor.department && apt.doctor.department.toLowerCase().includes(term)) ||
      (apt.payment?.transactionRef && apt.payment.transactionRef.toLowerCase().includes(term))
    );
  });

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

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Hospital Appointments</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Comprehensive hospital appointment ledger, payment records, and doctor scheduling
            </p>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search ref, patient, doctor..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 w-64 transition-all"
            />
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Filters:</span>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs py-1.5 px-3 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="rejected">Rejected</option>
          </select>

          {/* Doctor Filter */}
          <select
            value={doctorFilter}
            onChange={(e) => {
              setDoctorFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs py-1.5 px-3 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 max-w-[200px]"
          >
            <option value="">All Doctors</option>
            {doctorsList.map((doc) => (
              <option key={doc.id} value={doc.id}>
                Dr. {doc.user?.name || (doc as any).name}
              </option>
            ))}
          </select>

          {/* Date Filter */}
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs py-1.5 px-3 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <Card className="rounded-2xl border-slate-200">
          <CardContent className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                <div className="w-24 h-4 bg-slate-200 rounded" />
                <div className="w-36 h-4 bg-slate-200 rounded" />
                <div className="w-32 h-4 bg-slate-200 rounded" />
                <div className="w-24 h-4 bg-slate-100 rounded" />
                <div className="w-20 h-5 bg-slate-200 rounded-full" />
                <div className="w-20 h-5 bg-slate-100 rounded-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Error state */}
      {isError && (
        <div className="p-8 text-center bg-white rounded-2xl border border-rose-200 shadow-sm space-y-3">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">Failed to load appointments</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            An error occurred while fetching the appointment ledger.
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="text-xs">
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
            Retry
          </Button>
        </div>
      )}

      {/* Main Table */}
      {!isLoading && !isError && (
        <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden">
          <CardContent className="p-0">
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
                {paginatedAppointments.length > 0 ? (
                  paginatedAppointments.map((apt, idx) => {
                    const serialIndex = (currentPage - 1) * itemsPerPage + idx;
                    return (
                      <TableRow key={apt.id} className="hover:bg-slate-50/70 transition-colors">
                        <TableCellSerial index={serialIndex} />
                        <TableCell className="font-mono text-xs font-bold text-slate-800">
                          <div>{apt.appointmentNumber}</div>
                          {apt.rescheduleCount && apt.rescheduleCount > 0 ? (
                            <span className="inline-block mt-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                              Rescheduled ({apt.rescheduleCount})
                            </span>
                          ) : null}
                        </TableCell>

                        <TableCell>
                          <p className="font-semibold text-slate-900 text-xs sm:text-sm">{apt.patient.name}</p>
                          <p className="text-[11px] text-slate-400">{apt.patient.email}</p>
                          {apt.patient.phone && (
                            <p className="text-[11px] text-teal-600 font-medium">{apt.patient.phone}</p>
                          )}
                        </TableCell>

                        <TableCell>
                          <p className="font-medium text-slate-800 text-xs">Dr. {apt.doctor.name}</p>
                          <p className="text-[11px] text-slate-500">
                            {apt.doctor.specialization} &bull; {apt.doctor.department || 'General'}
                          </p>
                        </TableCell>

                        <TableCell>
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span>{apt.appointmentDate}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-semibold">
                              <Clock className="w-3 h-3 text-emerald-600" />
                              <span>{apt.startTime} - {apt.endTime}</span>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <PaymentBadge status={apt.payment?.status} />
                          {apt.payment?.amount && (
                            <span className="block text-[10px] text-slate-500 font-medium mt-0.5">
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
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedAppointment(apt)}
                            className="text-xs text-slate-700 hover:text-slate-900"
                          >
                            Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-16 text-slate-400 text-xs">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Calendar className="w-8 h-8 text-slate-300" />
                        <p className="font-bold text-slate-700 text-sm">No appointments found</p>
                        <p className="text-slate-400">
                          {hasActiveFilters
                            ? 'No appointments match the selected filter criteria.'
                            : 'No appointments recorded in the system ledger yet.'}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {/* Pagination footer */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                <span className="text-xs text-slate-500 font-medium">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                  {Math.min(currentPage * itemsPerPage, filteredAppointments.length)} of{' '}
                  {filteredAppointments.length} entries
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    className="text-xs h-8"
                  >
                    <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                    Previous
                  </Button>
                  <span className="text-xs font-semibold text-slate-700 px-2">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                    className="text-xs h-8"
                  >
                    Next
                    <ChevronRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Appointment Details Modal */}
      {selectedAppointment && (
        <Modal
          isOpen={!!selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
          title={`Appointment Details - ${selectedAppointment.appointmentNumber}`}
          description={`Created on ${new Date(selectedAppointment.createdAt).toLocaleDateString()}`}
        >
          <div className="space-y-4 text-xs">
            {/* Patient & Doctor Box */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-slate-400 block mb-0.5 font-semibold text-[10px] uppercase">Patient:</span>
                <span className="font-bold text-slate-900 text-sm">{selectedAppointment.patient.name}</span>
                <span className="text-slate-500 block">{selectedAppointment.patient.email}</span>
                <span className="text-slate-500 block">{selectedAppointment.patient.phone || 'No phone'}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5 font-semibold text-[10px] uppercase">Doctor:</span>
                <span className="font-bold text-slate-900 text-sm">Dr. {selectedAppointment.doctor.name}</span>
                <span className="text-slate-500 block">{selectedAppointment.doctor.specialization}</span>
                <span className="text-slate-500 block">{selectedAppointment.doctor.department}</span>
              </div>
            </div>

            {/* Schedule & Badges */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-slate-400 block mb-0.5 font-semibold text-[10px] uppercase">Scheduled Slot:</span>
                <span className="font-bold text-slate-800 text-xs">
                  {selectedAppointment.appointmentDate} at {selectedAppointment.startTime} - {selectedAppointment.endTime}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={selectedAppointment.status} />
                <PaymentBadge status={selectedAppointment.payment?.status} />
              </div>
            </div>

            {/* Payment Record */}
            {selectedAppointment.payment && (
              <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-100 flex items-center justify-between">
                <div>
                  <span className="text-emerald-900 font-bold text-xs block">Payment Record</span>
                  <span className="text-[11px] text-emerald-700">
                    Status: <strong className="capitalize">{selectedAppointment.payment.status}</strong>
                    {selectedAppointment.payment.transactionRef && ` • Ref: ${selectedAppointment.payment.transactionRef}`}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-emerald-950">
                    Rs. {Number(selectedAppointment.payment.amount).toFixed(2)}
                  </span>
                  {selectedAppointment.payment.method && (
                    <span className="block text-[10px] text-emerald-700 uppercase font-bold">
                      {selectedAppointment.payment.method}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Rejection / Cancellation Reason */}
            {selectedAppointment.rejectionReason && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200">
                <span className="text-rose-800 block mb-1 font-semibold uppercase text-[10px]">
                  Reason for Rejection / Cancellation:
                </span>
                <p className="text-rose-900">{selectedAppointment.rejectionReason}</p>
              </div>
            )}

            {/* Reason for Visit */}
            {selectedAppointment.reasonForVisit && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 block mb-1 font-semibold uppercase text-[10px]">
                  Reason for Visit / Symptoms:
                </span>
                <p className="text-slate-700 leading-relaxed">{selectedAppointment.reasonForVisit}</p>
              </div>
            )}

            {/* Reschedule history */}
            {selectedAppointment.reschedules && selectedAppointment.reschedules.length > 0 && (
              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1.5">
                <span className="text-amber-900 block font-bold text-[11px] uppercase tracking-wider">
                  Reschedule Audit Log ({selectedAppointment.reschedules.length}):
                </span>
                {selectedAppointment.reschedules.map((r, i) => (
                  <div key={r.id || i} className="text-[11px] text-amber-800 flex items-center justify-between">
                    <span>
                      {r.oldDate} ({r.oldStartTime}) &rarr; {r.newDate} ({r.newStartTime})
                    </span>
                    <span className="text-[10px] text-amber-600">
                      by {r.rescheduledByName || r.rescheduledByRole || 'User'}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Consultation */}
            {selectedAppointment.consultation && (
              <div className="p-3.5 rounded-xl bg-teal-50/60 border border-teal-100 space-y-2">
                <span className="text-teal-900 block font-bold text-xs">Clinical Consultation Record</span>
                {selectedAppointment.consultation.diagnosis && (
                  <div>
                    <span className="text-slate-500 block font-semibold text-[11px]">Diagnosis:</span>
                    <p className="text-slate-800">{selectedAppointment.consultation.diagnosis}</p>
                  </div>
                )}
                {selectedAppointment.consultation.prescription && (
                  <div>
                    <span className="text-slate-500 block font-semibold text-[11px]">Prescription:</span>
                    <p className="text-slate-800 font-mono text-[11px] bg-white p-2 rounded border border-teal-200">
                      {selectedAppointment.consultation.prescription}
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              {selectedAppointment.status !== 'CANCELLED' &&
              selectedAppointment.status !== 'COMPLETED' &&
              selectedAppointment.status !== 'REJECTED' ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCancel(selectedAppointment.id)}
                  isLoading={cancelMutation.isPending}
                  className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 text-xs"
                >
                  Cancel Appointment
                </Button>
              ) : (
                <div />
              )}
              <Button variant="outline" size="sm" onClick={() => setSelectedAppointment(null)} className="text-xs">
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
