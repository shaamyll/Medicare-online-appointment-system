import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/Table';
import { LoadingState } from '@/components/ui/LoadingState';
import { useToast } from '@/components/ui/Toast';
import { useAppointments, useCancelAppointment } from '@/features/appointments/hooks/useAppointments';
import { Appointment } from '@/features/appointments/types/appointment.types';

export const AdminAppointmentsPage: React.FC = () => {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const { data: appointments, isLoading } = useAppointments(
    statusFilter ? { status: statusFilter } : undefined
  );
  const cancelMutation = useCancelAppointment();

  const handleCancel = async (id: number) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }
    try {
      await cancelMutation.mutateAsync(id);
      toast('Appointment cancelled', 'info');
      setSelectedAppointment(null);
    } catch (err: any) {
      toast(err.message || 'Failed to cancel appointment', 'error');
    }
  };

  const filteredAppointments = (appointments || []).filter((apt) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      apt.appointmentNumber.toLowerCase().includes(term) ||
      apt.patient.name.toLowerCase().includes(term) ||
      apt.doctor.name.toLowerCase().includes(term) ||
      (apt.doctor.department && apt.doctor.department.toLowerCase().includes(term))
    );
  });

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
    return <LoadingState message="Loading hospital appointment ledger..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Hospital Appointments</h1>
          <p className="text-sm text-slate-500">
            Real-time tracking of patient bookings, clinical consultations, and doctor schedules
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by ref, patient, doctor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500 w-56"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs py-1.5 px-3 rounded-lg border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:border-emerald-500"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference #</TableHead>
                <TableHead>Patient Details</TableHead>
                <TableHead>Assigned Doctor</TableHead>
                <TableHead>Date & Slot</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAppointments.length > 0 ? (
                filteredAppointments.map((apt) => (
                  <TableRow key={apt.id}>
                    <TableCell className="font-mono text-xs font-bold text-slate-800">
                      {apt.appointmentNumber}
                    </TableCell>

                    <TableCell>
                      <p className="font-semibold text-slate-900 text-sm">{apt.patient.name}</p>
                      <p className="text-xs text-slate-400">{apt.patient.email}</p>
                    </TableCell>

                    <TableCell>
                      <p className="font-medium text-slate-800 text-xs">{apt.doctor.name}</p>
                      <p className="text-[11px] text-slate-500">
                        {apt.doctor.specialization} &bull; {apt.doctor.department || 'General'}
                      </p>
                    </TableCell>

                    <TableCell>
                      <p className="text-xs font-medium text-slate-900">{apt.appointmentDate}</p>
                      <p className="text-[11px] text-emerald-700 font-semibold">{apt.startTime} - {apt.endTime}</p>
                    </TableCell>

                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(apt.status)}>
                        {apt.status}
                      </Badge>
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
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-400 text-xs">
                    No appointments found matching current filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Appointment Details Modal */}
      {selectedAppointment && (
        <Modal
          isOpen={!!selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
          title={`Appointment Details - ${selectedAppointment.appointmentNumber}`}
          description={`Created on ${new Date(selectedAppointment.createdAt).toLocaleDateString()}`}
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 grid grid-cols-2 gap-3">
              <div>
                <span className="text-slate-400 block mb-0.5">Patient:</span>
                <span className="font-bold text-slate-900 text-sm">{selectedAppointment.patient.name}</span>
                <span className="text-slate-500 block">{selectedAppointment.patient.email}</span>
                <span className="text-slate-500 block">{selectedAppointment.patient.phone || 'No phone'}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Doctor:</span>
                <span className="font-bold text-slate-900 text-sm">{selectedAppointment.doctor.name}</span>
                <span className="text-slate-500 block">{selectedAppointment.doctor.specialization}</span>
                <span className="text-slate-500 block">{selectedAppointment.doctor.department}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-slate-400 block mb-0.5">Scheduled Slot:</span>
                <span className="font-bold text-slate-800">
                  {selectedAppointment.appointmentDate} at {selectedAppointment.startTime} - {selectedAppointment.endTime}
                </span>
              </div>
              <Badge variant={getStatusBadgeVariant(selectedAppointment.status)}>
                {selectedAppointment.status}
              </Badge>
            </div>

            {selectedAppointment.reasonForVisit && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block mb-1 font-semibold uppercase tracking-wider text-[10px]">
                  Reason for Visit / Symptoms:
                </span>
                <p className="text-slate-700 leading-relaxed">{selectedAppointment.reasonForVisit}</p>
              </div>
            )}

            {selectedAppointment.consultation && (
              <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100 space-y-2">
                <span className="text-emerald-800 block font-bold text-xs">Clinical Consultation Record</span>
                {selectedAppointment.consultation.diagnosis && (
                  <div>
                    <span className="text-slate-500 block font-semibold text-[11px]">Diagnosis:</span>
                    <p className="text-slate-800">{selectedAppointment.consultation.diagnosis}</p>
                  </div>
                )}
                {selectedAppointment.consultation.prescription && (
                  <div>
                    <span className="text-slate-500 block font-semibold text-[11px]">Prescription:</span>
                    <p className="text-slate-800 font-mono text-[11px] bg-white p-2 rounded border border-emerald-200">
                      {selectedAppointment.consultation.prescription}
                    </p>
                  </div>
                )}
                {selectedAppointment.consultation.consultationNotes && (
                  <div>
                    <span className="text-slate-500 block font-semibold text-[11px]">Physician Notes:</span>
                    <p className="text-slate-800">{selectedAppointment.consultation.consultationNotes}</p>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              {selectedAppointment.status !== 'CANCELLED' && selectedAppointment.status !== 'COMPLETED' ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCancel(selectedAppointment.id)}
                  isLoading={cancelMutation.isPending}
                  className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
                >
                  Cancel Appointment
                </Button>
              ) : (
                <div></div>
              )}
              <Button variant="outline" size="sm" onClick={() => setSelectedAppointment(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
