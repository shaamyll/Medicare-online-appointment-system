import React, { useState } from 'react';
import { PlusCircle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/Table';
import { LoadingState } from '@/components/ui/LoadingState';
import { useToast } from '@/components/ui/Toast';
import { useAppointments, useCancelAppointment } from '@/features/appointments/hooks/useAppointments';
import { AppointmentBookingModal } from '@/features/appointments/components/AppointmentBookingModal';
import { Appointment } from '@/features/appointments/types/appointment.types';

export const PatientAppointmentsPage: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [viewingAppointment, setViewingAppointment] = useState<Appointment | null>(null);

  const { data: appointments, isLoading } = useAppointments();
  const cancelMutation = useCancelAppointment();

  const handleCancel = async (id: number, aptNumber: string) => {
    if (!window.confirm(`Are you sure you want to cancel appointment #${aptNumber}?`)) {
      return;
    }
    try {
      await cancelMutation.mutateAsync(id);
      toast('Appointment cancelled successfully', 'info');
      setViewingAppointment(null);
    } catch (err: any) {
      toast(err.message || 'Failed to cancel appointment', 'error');
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const allApts = appointments || [];

  const upcomingApts = allApts.filter(
    (a) => (a.status === 'PENDING' || a.status === 'APPROVED' || a.status === 'CONFIRMED') && a.appointmentDate >= todayStr
  );

  const historyApts = allApts.filter(
    (a) => a.status === 'COMPLETED' || a.status === 'CANCELLED' || a.status === 'REJECTED' || a.appointmentDate < todayStr
  );

  const displayedApts = activeTab === 'upcoming' ? upcomingApts : historyApts;

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'APPROVED':
      case 'CONFIRMED':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'COMPLETED':
        return 'info';
      case 'CANCELLED':
      case 'REJECTED':
        return 'danger';
      default:
        return 'default';
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading your consultation appointments..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">My Appointments</h1>
          <p className="text-sm text-slate-500">
            Track your scheduled visits, check booking status, and review medical prescriptions
          </p>
        </div>

        <Button
          onClick={() => setIsBookingOpen(true)}
          leftIcon={<PlusCircle className="w-4 h-4" />}
          className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
        >
          Book New Appointment
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-4">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'upcoming'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Upcoming Appointments</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-extrabold">
            {upcomingApts.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'history'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Appointment History</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-600 font-extrabold">
            {historyApts.length}
          </span>
        </button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference #</TableHead>
                <TableHead>Doctor & Specialty</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Reason for Visit</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedApts.length > 0 ? (
                displayedApts.map((apt) => (
                  <TableRow key={apt.id}>
                    <TableCell className="font-mono text-xs font-bold text-slate-800">
                      {apt.appointmentNumber}
                    </TableCell>

                    <TableCell>
                      <p className="font-semibold text-slate-900 text-sm">{apt.doctor.name}</p>
                      <p className="text-xs text-slate-500">
                        {apt.doctor.specialization} &bull; {apt.doctor.department || 'General'}
                      </p>
                    </TableCell>

                    <TableCell>
                      <p className="text-xs font-bold text-slate-900">{apt.appointmentDate}</p>
                      <p className="text-[11px] text-emerald-700 font-semibold">{apt.startTime} - {apt.endTime}</p>
                    </TableCell>

                    <TableCell>
                      <p className="text-xs text-slate-600 max-w-xs truncate">
                        {apt.reasonForVisit || 'General Medical Consultation'}
                      </p>
                    </TableCell>

                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(apt.status)}>
                        {apt.status}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setViewingAppointment(apt)}
                          className="text-xs text-slate-700 hover:text-slate-900"
                        >
                          Details
                        </Button>
                        {apt.status === 'PENDING' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCancel(apt.id, apt.appointmentNumber)}
                            className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-400 text-xs">
                    {activeTab === 'upcoming'
                      ? 'No upcoming appointments scheduled. Book a visit with a doctor!'
                      : 'No past appointment records found.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Appointment Detail & Prescription Modal */}
      {viewingAppointment && (
        <Modal
          isOpen={!!viewingAppointment}
          onClose={() => setViewingAppointment(null)}
          title={`Appointment ${viewingAppointment.appointmentNumber}`}
          description={`Consultation on ${viewingAppointment.appointmentDate}`}
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start justify-between">
              <div>
                <span className="text-slate-400 block mb-0.5">Doctor:</span>
                <span className="font-bold text-slate-900 text-sm">{viewingAppointment.doctor.name}</span>
                <span className="text-slate-500 block">
                  {viewingAppointment.doctor.specialization} &bull; {viewingAppointment.doctor.department}
                </span>
                <span className="text-emerald-700 font-semibold block mt-1">
                  Consultation Fee: ${viewingAppointment.doctor.consultationFee?.toFixed(2)}
                </span>
              </div>
              <Badge variant={getStatusBadgeVariant(viewingAppointment.status)}>
                {viewingAppointment.status}
              </Badge>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block mb-1 font-semibold uppercase text-[10px]">
                Reason for Visit:
              </span>
              <p className="text-slate-700">{viewingAppointment.reasonForVisit || 'Not specified'}</p>
            </div>

            {/* Medical Prescription & Clinical Records */}
            {viewingAppointment.consultation ? (
              <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-100 space-y-2">
                <div className="flex items-center gap-1.5 text-emerald-900 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Physician Consultation Notes & Prescription</span>
                </div>

                {viewingAppointment.consultation.diagnosis && (
                  <div>
                    <span className="text-slate-500 font-semibold block text-[11px]">Diagnosis:</span>
                    <p className="text-slate-800 font-medium">{viewingAppointment.consultation.diagnosis}</p>
                  </div>
                )}

                {viewingAppointment.consultation.prescription && (
                  <div>
                    <span className="text-slate-500 font-semibold block text-[11px]">Prescription:</span>
                    <pre className="font-mono text-[11px] bg-white p-2.5 rounded-lg border border-emerald-200 text-slate-800 whitespace-pre-wrap">
                      {viewingAppointment.consultation.prescription}
                    </pre>
                  </div>
                )}

                {viewingAppointment.consultation.consultationNotes && (
                  <div>
                    <span className="text-slate-500 font-semibold block text-[11px]">Follow-up Advice:</span>
                    <p className="text-slate-700">{viewingAppointment.consultation.consultationNotes}</p>
                  </div>
                )}
              </div>
            ) : viewingAppointment.status === 'COMPLETED' ? (
              <p className="text-slate-400 italic">No prescription written for this visit.</p>
            ) : null}

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              {viewingAppointment.status === 'PENDING' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCancel(viewingAppointment.id, viewingAppointment.appointmentNumber)}
                  className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
                >
                  Cancel Appointment
                </Button>
              )}
              <div className="ml-auto">
                <Button variant="outline" size="sm" onClick={() => setViewingAppointment(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Booking Modal */}
      <AppointmentBookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
      />
    </div>
  );
};
