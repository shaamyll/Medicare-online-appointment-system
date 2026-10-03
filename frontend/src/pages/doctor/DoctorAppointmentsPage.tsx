import React, { useState } from 'react';
import {
  FileEdit,
  Search,
  Calendar,
  Clock,
  Phone,
  CalendarClock,
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
import {
  useAppointments,
  useUpdateAppointmentStatus,
  useAddConsultation,
} from '@/features/appointments/hooks/useAppointments';
import { Appointment } from '@/features/appointments/types/appointment.types';
import { RejectReasonModal } from '@/features/appointments/components/RejectReasonModal';
import { RescheduleModal } from '@/features/appointments/components/RescheduleModal';

export const DoctorAppointmentsPage: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'requests' | 'upcoming' | 'history'>('requests');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [rejectingApt, setRejectingApt] = useState<Appointment | null>(null);
  const [reschedulingApt, setReschedulingApt] = useState<Appointment | null>(null);
  const [consultationModalApt, setConsultationModalApt] = useState<Appointment | null>(null);
  const [diagnosis, setDiagnosis] = useState('');
  const [prescription, setPrescription] = useState('');
  const [consultationNotes, setConsultationNotes] = useState('');

  const { data: appointments, isLoading, isError, refetch } = useAppointments();
  const updateStatusMutation = useUpdateAppointmentStatus();
  const addConsultationMutation = useAddConsultation();

  const allApts = appointments || [];

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

  const todayStr = new Date().toISOString().split('T')[0];

  const filteredByTab = allApts.filter((apt) => {
    const st = apt.status.toUpperCase();
    if (activeTab === 'requests') {
      return st === 'PENDING';
    } else if (activeTab === 'upcoming') {
      return (st === 'APPROVED' || st === 'CONFIRMED') && apt.appointmentDate >= todayStr;
    } else {
      // history: completed, cancelled, rejected, or past approved
      return st === 'COMPLETED' || st === 'CANCELLED' || st === 'REJECTED' || apt.appointmentDate < todayStr;
    }
  });

  const displayedApts = filteredByTab.filter((apt) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      apt.appointmentNumber.toLowerCase().includes(term) ||
      apt.patient.name.toLowerCase().includes(term) ||
      (apt.patient.phone && apt.patient.phone.includes(term)) ||
      (apt.patient.email && apt.patient.email.toLowerCase().includes(term))
    );
  });

  const pendingCount = allApts.filter((a) => a.status.toUpperCase() === 'PENDING').length;
  const upcomingCount = allApts.filter(
    (a) => (a.status.toUpperCase() === 'APPROVED' || a.status.toUpperCase() === 'CONFIRMED') && a.appointmentDate >= todayStr
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Appointments Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Review incoming consultation requests, reschedule shifts, and manage patient prescriptions
          </p>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search patient, phone, ref..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 w-64 transition-all"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab('requests')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === 'requests'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Pending Requests</span>
          {pendingCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-800 font-extrabold">
              {pendingCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('upcoming')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === 'upcoming'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Upcoming Visits</span>
          {upcomingCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-extrabold">
              {upcomingCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === 'history'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Consultation History & Notes</span>
        </button>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <Card className="rounded-2xl border-slate-200">
          <CardContent className="p-6 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-slate-200" />
                  <div className="space-y-1.5">
                    <div className="w-36 h-4 bg-slate-200 rounded" />
                    <div className="w-24 h-3 bg-slate-100 rounded" />
                  </div>
                </div>
                <div className="w-28 h-5 bg-slate-200 rounded-full" />
                <div className="w-20 h-5 bg-slate-100 rounded-full" />
                <div className="w-32 h-8 bg-slate-200 rounded-lg" />
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
            An error occurred while fetching your appointments. Please check your connection and try again.
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="text-xs">
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
            Retry
          </Button>
        </div>
      )}

      {/* Content Table */}
      {!isLoading && !isError && (
        <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden">
          <CardContent className="p-0">
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
                {displayedApts.length > 0 ? (
                  displayedApts.map((apt, idx) => {
                    const st = apt.status.toUpperCase();
                    const canReschedule = st === 'PENDING' || st === 'APPROVED' || st === 'CONFIRMED';
                    const isUpcoming = (st === 'APPROVED' || st === 'CONFIRMED') && apt.appointmentDate >= todayStr;

                    return (
                      <TableRow key={apt.id} className="hover:bg-slate-50/70 transition-colors">
                        <TableCellSerial index={idx} />
                        <TableCell className="font-mono text-xs font-bold text-slate-800">
                          <div>{apt.appointmentNumber}</div>
                          {apt.rescheduleCount && apt.rescheduleCount > 0 ? (
                            <span className="inline-block mt-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                              Rescheduled ({apt.rescheduleCount})
                            </span>
                          ) : null}
                        </TableCell>

                        <TableCell>
                          <div className="flex items-start gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0 border border-emerald-100">
                              {apt.patient.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900 text-xs sm:text-sm">{apt.patient.name}</p>
                              <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                                <span>{apt.patient.email}</span>
                                {apt.patient.phone && (
                                  <>
                                    <span>•</span>
                                    <span className="flex items-center gap-1 text-teal-700 font-medium">
                                      <Phone className="w-3 h-3" />
                                      {apt.patient.phone}
                                    </span>
                                  </>
                                )}
                              </div>
                              {apt.reasonForVisit && (
                                <p className="text-[11px] text-slate-500 mt-1 italic max-w-xs truncate">
                                  "{apt.reasonForVisit}"
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
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
                          {apt.payment?.method && (
                            <span className="block text-[10px] text-slate-400 capitalize mt-0.5">
                              via {apt.payment.method}
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
                                  className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 text-xs px-2.5 h-7"
                                >
                                  Reject
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleApprove(apt)}
                                  isLoading={updateStatusMutation.isPending}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-2.5 h-7"
                                >
                                  Approve
                                </Button>
                              </>
                            )}

                            {/* Reschedule button for pending/approved */}
                            {canReschedule && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setReschedulingApt(apt)}
                                className="text-xs text-slate-700 border-slate-200 hover:bg-slate-50 h-7"
                                title="Reschedule slot"
                              >
                                <CalendarClock className="w-3.5 h-3.5 mr-1 text-slate-500" />
                                Reschedule
                              </Button>
                            )}

                            {/* Complete & Prescribe for upcoming confirmed visits */}
                            {isUpcoming && (
                              <Button
                                size="sm"
                                onClick={() => openConsultationModal(apt)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-7"
                              >
                                <FileEdit className="w-3.5 h-3.5 mr-1" />
                                Complete & Prescribe
                              </Button>
                            )}

                            {/* View / Edit notes for completed visits */}
                            {st === 'COMPLETED' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openConsultationModal(apt)}
                                className="text-xs text-teal-700 hover:bg-teal-50 h-7"
                              >
                                <FileEdit className="w-3.5 h-3.5 mr-1" />
                                Notes & Rx
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-16">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                          <Calendar className="w-6 h-6" />
                        </div>
                        <h4 className="text-sm font-bold text-slate-800">No appointments found</h4>
                        <p className="text-xs text-slate-400 max-w-sm">
                          {searchTerm
                            ? `No records matching "${searchTerm}" in this category.`
                            : activeTab === 'requests'
                            ? 'You currently have no pending appointment requests.'
                            : activeTab === 'upcoming'
                            ? 'No upcoming visits scheduled at the moment.'
                            : 'No completed or historical consultation records found.'}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Reject Reason Modal */}
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

      {/* Consultation Record / Prescription Modal */}
      {consultationModalApt && (
        <Modal
          isOpen={!!consultationModalApt}
          onClose={() => setConsultationModalApt(null)}
          title={`Clinical Consultation - ${consultationModalApt.patient.name}`}
          description={`Appointment #${consultationModalApt.appointmentNumber} on ${consultationModalApt.appointmentDate}`}
        >
          <form onSubmit={handleSaveConsultation} className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-400 block mb-1 font-semibold uppercase text-[10px]">
                Patient Reported Symptoms:
              </span>
              <p className="text-slate-700">{consultationModalApt.reasonForVisit || 'Not specified'}</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                Clinical Diagnosis *
              </label>
              <input
                type="text"
                placeholder="e.g. Stage 1 Hypertension, Acute Bronchitis"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-teal-500 focus:outline-hidden"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                Prescription & Dosage Details
              </label>
              <textarea
                rows={3}
                placeholder="e.g. 1. Lisinopril 10mg - 1 tablet once daily in the morning with water.&#10;2. Multivitamin tablet once daily after lunch."
                value={prescription}
                onChange={(e) => setPrescription(e.target.value)}
                className="w-full font-mono rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-teal-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                Consultation Advice / Follow-up Notes
              </label>
              <textarea
                rows={2}
                placeholder="Dietary instructions, exercise recommendations, return in 2 weeks..."
                value={consultationNotes}
                onChange={(e) => setConsultationNotes(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-teal-500 focus:outline-hidden"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <Button variant="outline" type="button" onClick={() => setConsultationModalApt(null)}>
                Cancel
              </Button>
              <Button
                type="submit"
                isLoading={addConsultationMutation.isPending}
                className="bg-teal-600 hover:bg-teal-700 text-white"
              >
                Save & Mark Completed
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
