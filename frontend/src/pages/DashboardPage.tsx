import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Stethoscope,
  CheckCircle2,
  ArrowRight,
  Star,
  Compass,
  CreditCard,
} from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell, TableHeadSerial, TableCellSerial } from '@/components/ui/Table';
import { useToast } from '@/components/ui/Toast';
import { useDoctors } from '@/features/doctors/hooks/useDoctors';
import { useAppointments, useCancelAppointment } from '@/features/appointments/hooks/useAppointments';
import { LoadingState } from '@/components/ui/LoadingState';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [cancellingApt, setCancellingApt] = useState<{ id: number; ref: string } | null>(null);

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

  // Pending reviews: completed visits with no review, up to 3
  const pendingReviews = allApts
    .filter(
      (a) =>
        a.status === 'COMPLETED' &&
        (!a.review || !a.review.rating) &&
        (!a.feedback || !a.feedback.rating)
    )
    .slice(0, 3);

  const handleCancelConfirm = async () => {
    if (!cancellingApt) return;
    try {
      await cancelMutation.mutateAsync({ id: cancellingApt.id });
      toast('Appointment cancelled', 'info');
      setCancellingApt(null);
    } catch (err: any) {
      toast(err?.response?.data?.message || err.message || 'Failed to cancel appointment', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar name={user?.name} size="xl" shape="circle" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                Welcome back, {user?.name || 'Patient'}!
              </h1>
              <Badge variant="success">Patient</Badge>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Medi-Care Healthcare Portal &bull; Today is{' '}
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/dashboard/doctors')}
            leftIcon={<Compass className="w-4 h-4" />}
          >
            Find a Doctor
          </Button>
        </div>
      </div>

      {/* Pending Reviews Card (hidden when empty per specification) */}
      {pendingReviews.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/40 rounded-xl overflow-hidden shadow-xs">
          <CardHeader className="pb-3 border-b border-amber-200/60 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-amber-100 text-amber-700 rounded-lg">
                <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold text-amber-950">Pending Visit Reviews</CardTitle>
                <p className="text-xs text-amber-800/80">
                  Share your experience to help other patients choose the right physician
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {pendingReviews.map((apt) => (
              <div
                key={apt.id}
                className="bg-white rounded-lg border border-amber-200/80 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900 text-sm">Dr. {apt.doctor.name}</span>
                    <span className="text-xs text-emerald-700 font-semibold">{apt.doctor.specialization}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Visit on {apt.appointmentDate} at {apt.startTime} &bull; Ref #{apt.appointmentNumber}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="primary"
                  className="bg-amber-500 hover:bg-amber-600 text-white shrink-0"
                  leftIcon={<Star className="h-3.5 w-3.5 fill-current" />}
                  onClick={() => navigate(`/dashboard/appointments?tab=history&rate=${apt.id}`)}
                >
                  Rate now
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Card hover className="border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Upcoming Visits</p>
              <p className="text-2xl font-black text-gray-900 mt-1">{upcomingApts.length}</p>
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

        <Card hover className="border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Completed Visits</p>
              <p className="text-2xl font-black text-gray-900 mt-1">{completedApts.length}</p>
            </div>
            <div className="p-3 bg-sky-50 text-sky-600 rounded-xl">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3 font-medium">With clinical prescriptions</p>
        </Card>

        <Card hover className="border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Available Specialists</p>
              <p className="text-2xl font-black text-gray-900 mt-1">{doctors?.length || 0}</p>
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <Stethoscope className="w-5 h-5" />
            </div>
          </div>
          <button
            onClick={() => navigate('/dashboard/doctors')}
            className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold mt-3 inline-flex items-center gap-1 cursor-pointer"
          >
            Browse all physicians &rarr;
          </button>
        </Card>
      </div>

      {/* Upcoming Appointments Table */}
      <Card className="rounded-xl border-gray-200 shadow-sm overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-gray-100">
          <div>
            <CardTitle>My Upcoming Appointments</CardTitle>
            <p className="text-xs text-gray-500 mt-0.5">Your scheduled clinical consultations and checkups</p>
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
                <TableHead className="text-right pr-6">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {upcomingApts.length > 0 ? (
                upcomingApts.map((apt, idx) => (
                  <TableRow key={apt.id} className="hover:bg-gray-50 transition-colors">
                    <TableCellSerial index={idx} />
                    <TableCell className="font-mono text-xs font-semibold text-gray-800">
                      {apt.appointmentNumber}
                    </TableCell>

                    <TableCell>
                      <p className="font-semibold text-gray-900 text-sm">Dr. {apt.doctor.name}</p>
                      <p className="text-xs text-gray-500">
                        {apt.doctor.specialization} &bull; {apt.doctor.department || 'General'}
                      </p>
                    </TableCell>

                    <TableCell>
                      <p className="text-xs font-semibold text-gray-900">{apt.appointmentDate}</p>
                      <p className="text-[11px] text-emerald-700 font-semibold">{apt.startTime} - {apt.endTime}</p>
                    </TableCell>

                    <TableCell>
                      <p className="text-xs text-gray-600 max-w-xs truncate">{apt.reasonForVisit || 'Routine Checkup'}</p>
                    </TableCell>

                    <TableCell>
                      <StatusBadge status={apt.status} />
                    </TableCell>

                    <TableCell className="text-right pr-6">
                      <div className="flex items-center justify-end gap-1.5">
                        {Boolean(apt.canPay ?? apt.can_pay) && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => navigate(`/dashboard/appointments?pay=${apt.id}`)}
                            leftIcon={<CreditCard className="w-3.5 h-3.5" />}
                            className="text-xs h-8"
                          >
                            Pay now
                          </Button>
                        )}
                        {apt.status === 'PENDING' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCancellingApt({ id: apt.id, ref: apt.appointmentNumber })}
                            className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 h-8"
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
                  <TableCell colSpan={7} className="text-center py-12 text-gray-400 text-xs">
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
            <h2 className="text-lg font-bold text-gray-900">Featured Physicians & Specialists</h2>
            <p className="text-xs text-gray-500">Book directly with certified independent and clinic specialists</p>
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
            <Card key={doc.id} hover className="border-gray-200 flex flex-col justify-between overflow-hidden">
              <div className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-700 font-bold flex items-center justify-center text-sm border border-emerald-100">
                    {doc.user.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">Dr. {doc.user.name}</h3>
                    <p className="text-xs text-emerald-700 font-semibold">{doc.specialization}</p>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-gray-600 mb-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Department:</span>
                    <span className="font-medium text-gray-800">{doc.department?.name || 'General Clinic'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Consultation Fee:</span>
                    <span className="font-bold text-emerald-700">Rs. {Number(doc.consultationFee || 0).toFixed(0)}</span>
                  </div>
                </div>
              </div>

              <CardFooter className="p-3 bg-gray-50">
                <Button
                  size="sm"
                  onClick={() => navigate(`/dashboard/doctors?bookDoctor=${doc.id}`)}
                  className="w-full text-xs"
                >
                  Schedule Consultation
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      {/* Cancellation Modal */}
      {cancellingApt && (
        <ConfirmModal
          isOpen={!!cancellingApt}
          onClose={() => setCancellingApt(null)}
          title="Cancel Appointment"
          description={`Are you sure you want to cancel appointment #${cancellingApt.ref}? This slot will be released.`}
          confirmLabel="Cancel Appointment"
          variant="danger"
          isLoading={cancelMutation.isPending}
          onConfirm={handleCancelConfirm}
        />
      )}
    </div>
  );
};
