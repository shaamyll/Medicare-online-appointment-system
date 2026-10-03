import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell, TableHeadSerial, TableCellSerial } from '@/components/ui/Table';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useAppointments } from '@/features/appointments/hooks/useAppointments';
import { LoadingState } from '@/components/ui/LoadingState';

export const DoctorDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: appointments, isLoading } = useAppointments();

  if (isLoading) {
    return <LoadingState message="Loading your clinical schedule..." />;
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const allApts = appointments || [];

  const pendingRequests = allApts.filter((a) => a.status === 'PENDING');
  const todayApts = allApts.filter((a) => a.appointmentDate === todayStr && a.status !== 'CANCELLED');
  const upcomingApts = allApts.filter((a) => a.appointmentDate >= todayStr && a.status !== 'CANCELLED');
  const completedApts = allApts.filter((a) => a.status === 'COMPLETED');

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Welcome, {user?.name || 'Doctor'}
            </h1>
            <Badge variant="success">Practicing</Badge>
          </div>
          <p className="text-sm text-slate-500">
            Clinical Consultation Portal &bull; Today is{' '}
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/doctor/schedule')}
            leftIcon={<Clock className="w-4 h-4" />}
          >
            Configure Shifts
          </Button>
          <Button
            size="sm"
            onClick={() => navigate('/doctor/appointments')}
            className="bg-teal-600 hover:bg-teal-700 text-white"
          >
            Manage Appointments
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card hover>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Today's Visits</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{todayApts.length}</p>
            </div>
            <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3 font-medium">Scheduled for today</p>
        </Card>

        <Card hover>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Pending Requests</p>
              <p className={`text-2xl font-black mt-1 ${pendingRequests.length > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
                {pendingRequests.length}
              </p>
            </div>
            <div className={`p-3 rounded-xl ${pendingRequests.length > 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-400'}`}>
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <button
            onClick={() => navigate('/doctor/appointments')}
            className="text-xs text-amber-600 hover:text-amber-700 font-semibold mt-3 inline-flex items-center gap-1"
          >
            Awaiting your confirmation &rarr;
          </button>
        </Card>

        <Card hover>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Upcoming Shifts</p>
              <p className="text-2xl font-black text-emerald-600 mt-1">{upcomingApts.length}</p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3 font-medium">Active future bookings</p>
        </Card>

        <Card hover>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Completed Consultations</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{completedApts.length}</p>
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3 font-medium">With recorded medical notes</p>
        </Card>
      </div>

      {/* Today's Agenda Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <CardTitle>Upcoming Consultations</CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">Patients booked for consultation shifts</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/doctor/appointments')}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            className="text-xs text-teal-600 hover:text-teal-700"
          >
            All Appointments
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeadSerial />
                <TableHead>Reference #</TableHead>
                <TableHead>Patient Details</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Symptoms / Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allApts.length > 0 ? (
                allApts.slice(0, 5).map((apt, idx) => (
                  <TableRow key={apt.id}>
                    <TableCellSerial index={idx} />
                    <TableCell className="font-mono text-xs font-semibold text-slate-800">
                      {apt.appointmentNumber}
                    </TableCell>

                    <TableCell>
                      <p className="font-semibold text-slate-900 text-sm">{apt.patient.name}</p>
                      <p className="text-xs text-slate-400">{apt.patient.phone || apt.patient.email}</p>
                    </TableCell>

                    <TableCell>
                      <p className="text-xs font-semibold text-slate-900">{apt.appointmentDate}</p>
                      <p className="text-[11px] text-teal-600 font-semibold">{apt.startTime} - {apt.endTime}</p>
                    </TableCell>

                    <TableCell>
                      <p className="text-xs text-slate-600 truncate max-w-xs">{apt.reasonForVisit || 'General review'}</p>
                    </TableCell>

                    <TableCell>
                      <StatusBadge status={apt.status} />
                    </TableCell>

                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate('/doctor/appointments')}
                        className="text-xs text-teal-600 hover:text-teal-700"
                      >
                        Open
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-slate-400 text-xs">
                    No scheduled appointments at this time.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
