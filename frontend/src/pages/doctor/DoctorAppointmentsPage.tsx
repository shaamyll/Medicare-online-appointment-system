import React, { useState } from 'react';
import {
  FileEdit,
  Search,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell, TableHeadSerial, TableCellSerial } from '@/components/ui/Table';
import { LoadingState } from '@/components/ui/LoadingState';
import { useToast } from '@/components/ui/Toast';
import {
  useAppointments,
  useUpdateAppointmentStatus,
  useAddConsultation,
} from '@/features/appointments/hooks/useAppointments';
import { Appointment } from '@/features/appointments/types/appointment.types';

export const DoctorAppointmentsPage: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'requests' | 'upcoming' | 'history'>('requests');
  const [searchTerm, setSearchTerm] = useState('');

  // Consultation modal state
  const [consultationModalApt, setConsultationModalApt] = useState<Appointment | null>(null);
  const [diagnosis, setDiagnosis] = useState('');
  const [prescription, setPrescription] = useState('');
  const [consultationNotes, setConsultationNotes] = useState('');

  const { data: appointments, isLoading } = useAppointments();
  const updateStatusMutation = useUpdateAppointmentStatus();
  const addConsultationMutation = useAddConsultation();

  const allApts = appointments || [];

  const handleUpdateStatus = async (id: number, status: string, patientName: string) => {
    try {
      await updateStatusMutation.mutateAsync({ id, status });
      toast(`Appointment for ${patientName} marked as ${status}.`, 'success');
    } catch (err: any) {
      toast(err.message || 'Failed to update appointment status', 'error');
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
      toast(err.message || 'Failed to save consultation', 'error');
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const filteredByTab = allApts.filter((apt) => {
    if (activeTab === 'requests') {
      return apt.status === 'PENDING';
    } else if (activeTab === 'upcoming') {
      return (apt.status === 'APPROVED' || apt.status === 'CONFIRMED') && apt.appointmentDate >= todayStr;
    } else {
      // history
      return apt.status === 'COMPLETED' || apt.status === 'CANCELLED' || apt.status === 'REJECTED' || apt.appointmentDate < todayStr;
    }
  });

  const displayedApts = filteredByTab.filter((apt) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      apt.appointmentNumber.toLowerCase().includes(term) ||
      apt.patient.name.toLowerCase().includes(term) ||
      (apt.patient.phone && apt.patient.phone.includes(term))
    );
  });

  if (isLoading) {
    return <LoadingState message="Loading your appointments ledger..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Appointments Management</h1>
          <p className="text-sm text-slate-500">
            Review incoming consultation requests, monitor shifts, and manage patient prescriptions
          </p>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by patient, ref..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-teal-500 w-56"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab('requests')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'requests'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Pending Requests</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-800 font-extrabold">
            {allApts.filter((a) => a.status === 'PENDING').length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('upcoming')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'upcoming'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Confirmed Upcoming Visits</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-extrabold">
            {allApts.filter((a) => (a.status === 'APPROVED' || a.status === 'CONFIRMED') && a.appointmentDate >= todayStr).length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'history'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Consultation History & Notes</span>
        </button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeadSerial />
                <TableHead>Reference #</TableHead>
                <TableHead>Patient Details</TableHead>
                <TableHead>Appointment Slot</TableHead>
                <TableHead>Symptoms / Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedApts.length > 0 ? (
                displayedApts.map((apt, idx) => (
                  <TableRow key={apt.id}>
                    <TableCellSerial index={idx} />
                    <TableCell className="font-mono text-xs font-bold text-slate-800">
                      {apt.appointmentNumber}
                    </TableCell>

                    <TableCell>
                      <p className="font-semibold text-slate-900 text-sm">{apt.patient.name}</p>
                      <p className="text-xs text-slate-400">{apt.patient.email}</p>
                      {apt.patient.phone && (
                        <p className="text-[11px] text-teal-600 font-medium">{apt.patient.phone}</p>
                      )}
                    </TableCell>

                    <TableCell>
                      <p className="text-xs font-bold text-slate-900">{apt.appointmentDate}</p>
                      <p className="text-[11px] text-teal-700 font-semibold">{apt.startTime} - {apt.endTime}</p>
                    </TableCell>

                    <TableCell>
                      <p className="text-xs text-slate-600 max-w-xs">{apt.reasonForVisit || 'General Medical Consultation'}</p>
                    </TableCell>

                    <TableCell>
                      <StatusBadge status={apt.status} />
                    </TableCell>

                    <TableCell className="text-right">
                      {apt.status === 'PENDING' && (
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateStatus(apt.id, 'rejected', apt.patient.name)}
                            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 text-xs px-2.5"
                          >
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleUpdateStatus(apt.id, 'approved', apt.patient.name)}
                            className="bg-teal-600 hover:bg-teal-700 text-white text-xs px-2.5"
                          >
                            Accept
                          </Button>
                        </div>
                      )}

                      {(apt.status === 'APPROVED' || apt.status === 'CONFIRMED') && (
                        <Button
                          size="sm"
                          onClick={() => openConsultationModal(apt)}
                          leftIcon={<FileEdit className="w-3.5 h-3.5" />}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                        >
                          Complete & Prescribe
                        </Button>
                      )}

                      {apt.status === 'COMPLETED' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openConsultationModal(apt)}
                          leftIcon={<FileEdit className="w-3.5 h-3.5" />}
                          className="text-xs text-teal-700 hover:bg-teal-50"
                        >
                          View / Edit Notes
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-slate-400 text-xs">
                    No appointments in this tab view.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

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
                className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-teal-500 focus:outline-none"
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
                className="w-full font-mono rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-teal-500 focus:outline-none"
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
                className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-teal-500 focus:outline-none"
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
