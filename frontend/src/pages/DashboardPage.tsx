import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Stethoscope,
  PlusCircle,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell, TableHeadSerial, TableCellSerial } from '@/components/ui/Table';
import { useToast } from '@/components/ui/Toast';
import { useDoctors } from '@/features/doctors/hooks/useDoctors';
import { useAppointments, useCancelAppointment } from '@/features/appointments/hooks/useAppointments';
import { AppointmentBookingModal } from '@/features/appointments/components/AppointmentBookingModal';
import { LoadingState } from '@/components/ui/LoadingState';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState<number | undefined>(undefined);

  const { data: doctors, isLoading: isLoadingDoctors } = useDoctors();
  const { data: appointments, isLoading: isLoadingApts } = useAppointments();
  const cancelMutation = useCancelAppointment();

  if (isLoadingApts || isLoadingDoctors) {
    return <LoadingState message="Loading your health portal..." />;
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const allApts = appointments || [];

  const upcomingApts = allApts.filter(
    (a) => (a.status === 'PENDING' || a.status === 'APPROVED' || a.status === 'CONFIRMED') && a.appointmentDate >= todayStr
  );
  const completedApts = allApts.filter((a) => a.status === 'COMPLETED');

  const handleCancel = async (id: number, ref: string) => {
    if (!window.confirm(`Are you sure you want to cancel appointment #${ref}?`)) {
      return;
    }
    try {
      await cancelMutation.mutateAsync(id);
      toast('Appointment cancelled', 'info');
    } catch (err: any) {
      toast(err.message || 'Failed to cancel appointment', 'error');
    }
  };

  const openBookingForDoctor = (docId: number) => {
    setSelectedDoctorId(docId);
    setIsBookingModalOpen(true);
  };

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Welcome back, {user?.name || 'Patient'}!
            </h1>
            <Badge variant="success">Patient Portal</Badge>
          </div>
          <p className="text-sm text-slate-500">
            Medi-Care Healthcare Portal &bull; Today is{' '}
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/dashboard/doctors')}
            className="border-slate-300"
          >
            Find Doctors
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setSelectedDoctorId(undefined);
              setIsBookingModalOpen(true);
            }}
            leftIcon={<PlusCircle className="w-4 h-4" />}
            className="bg-emerald-600 hover:bg-emerald-700 shadow-sm"
          >
            Book Appointment
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Card hover>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Upcoming Visits</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{upcomingApts.length}</p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-emerald-600 font-medium mt-3">
            {upcomingApts.length > 0
              ? `Next: ${upcomingApts[0].appointmentDate} at ${upcomingApts[0].startTime}`
              : 'No appointments upcoming'}
          </p>
        </Card>

        <Card hover>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Completed Visits</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{completedApts.length}</p>
            </div>
            <div className="p-3 bg-sky-50 text-sky-600 rounded-xl">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3 font-medium">With clinical prescriptions</p>
        </Card>

        <Card hover>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Available Specialists</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{doctors?.length || 0}</p>
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <Stethoscope className="w-5 h-5" />
            </div>
          </div>
          <button
            onClick={() => navigate('/dashboard/doctors')}
            className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold mt-3 inline-flex items-center gap-1"
          >
            Browse all physicians &rarr;
          </button>
        </Card>
      </div>

      {/* Upcoming Appointments */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <CardTitle>My Upcoming Appointments</CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">Your scheduled clinical consultations and checkups</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard/appointments')}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            className="text-xs text-emerald-600 hover:text-emerald-700"
          >
            View All
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeadSerial />
                <TableHead>Reference #</TableHead>
                <TableHead>Doctor & Specialty</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Reason for Visit</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {upcomingApts.length > 0 ? (
                upcomingApts.map((apt, idx) => (
                  <TableRow key={apt.id}>
                    <TableCellSerial index={idx} />
                    <TableCell className="font-mono text-xs font-semibold text-slate-800">
                      {apt.appointmentNumber}
                    </TableCell>

                    <TableCell>
                      <p className="font-semibold text-slate-900 text-sm">{apt.doctor.name}</p>
                      <p className="text-xs text-slate-500">
                        {apt.doctor.specialization} &bull; {apt.doctor.department || 'General'}
                      </p>
                    </TableCell>

                    <TableCell>
                      <p className="text-xs font-semibold text-slate-900">{apt.appointmentDate}</p>
                      <p className="text-[11px] text-emerald-700 font-semibold">{apt.startTime} - {apt.endTime}</p>
                    </TableCell>

                    <TableCell>
                      <p className="text-xs text-slate-600 max-w-xs truncate">{apt.reasonForVisit || 'Routine Checkup'}</p>
                    </TableCell>

                    <TableCell>
                      <StatusBadge status={apt.status} />
                    </TableCell>

                    <TableCell className="text-right">
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
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-slate-400 text-xs">
                    No upcoming appointments scheduled.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Featured Doctors Directory Preview */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Featured Hospital Physicians</h2>
            <p className="text-xs text-slate-500">Book directly with certified specialists</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard/doctors')}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            className="text-xs text-emerald-600 hover:text-emerald-700"
          >
            Browse All Doctors
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {doctors?.slice(0, 3).map((doc) => (
            <Card key={doc.id} hover className="p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-700 font-bold flex items-center justify-center text-sm">
                    {doc.user.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{doc.user.name}</h3>
                    <p className="text-xs text-emerald-700 font-semibold">{doc.specialization}</p>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 mb-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Department:</span>
                    <span className="font-medium text-slate-800">{doc.department?.name || 'General Clinic'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Consultation Fee:</span>
                    <span className="font-bold text-emerald-700">${doc.consultationFee?.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <Button
                size="sm"
                onClick={() => openBookingForDoctor(doc.id)}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs mt-2"
              >
                Schedule Consultation
              </Button>
            </Card>
          ))}
        </div>
      </div>

      {/* Booking Modal */}
      <AppointmentBookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        preselectedDoctorId={selectedDoctorId}
      />
    </div>
  );
};
