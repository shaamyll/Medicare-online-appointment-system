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
import { PageHeader } from '@/components/ui/PageHeader';
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
      <PageHeader
        title={`Welcome, ${user?.name || 'Doctor'}`}
        subtitle={`Clinical Consultation Portal • Today is ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}`}
        badge={<Badge variant="success">Practicing</Badge>}
        actions={
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
            >
              Manage Appointments
            </Button>
          </div>
        }
      />

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card hover className="border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Today's Visits</p>
              <p className="text-2xl font-black text-gray-900 mt-1">{todayApts.length}</p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3 font-medium">Scheduled for today</p>
        </Card>

        <Card hover className="border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Pending Requests</p>
              <p className={`text-2xl font-black mt-1 ${pendingRequests.length > 0 ? 'text-amber-600' : 'text-gray-900'}`}>
                {pendingRequests.length}
              </p>
            </div>
            <div className={`p-3 rounded-xl ${pendingRequests.length > 0 ? 'bg-amber-50 text-amber-600' : 'bg-gray-100 text-gray-400'}`}>
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <button
            onClick={() => navigate('/doctor/appointments')}
            className="text-xs text-amber-600 hover:text-amber-700 font-semibold mt-3 inline-flex items-center gap-1 cursor-pointer"
          >
            Awaiting your confirmation &rarr;
          </button>
        </Card>

        <Card hover className="border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Upcoming Shifts</p>
              <p className="text-2xl font-black text-emerald-600 mt-1">{upcomingApts.length}</p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3 font-medium">Active future bookings</p>
        </Card>

        <Card hover className="border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Completed Consultations</p>
              <p className="text-2xl font-black text-gray-900 mt-1">{completedApts.length}</p>
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3 font-medium">With recorded medical notes</p>
        </Card>
      </div>

      {/* Today's Agenda Table */}
      <Card className="rounded-xl border-gray-200 shadow-sm overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-gray-100">
          <div>
            <CardTitle>Upcoming Consultations</CardTitle>
            <p className="text-xs text-gray-500 mt-0.5">Patients booked for consultation shifts</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/doctor/appointments')}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            className="text-xs text-emerald-600 hover:text-emerald-700"
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
                <TableHead className="text-right pr-6">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allApts.length > 0 ? (
                allApts.slice(0, 5).map((apt, idx) => (
                  <TableRow key={apt.id} className="hover:bg-gray-50 transition-colors">
                    <TableCellSerial index={idx} />
                    <TableCell className="font-mono text-xs font-semibold text-gray-800">
                      {apt.appointmentNumber}
                    </TableCell>

                    <TableCell>
                      <p className="font-semibold text-gray-900 text-sm">{apt.patient.name}</p>
                      <p className="text-xs text-gray-400">{apt.patient.phone || apt.patient.email}</p>
                    </TableCell>

                    <TableCell>
                      <p className="text-xs font-semibold text-gray-900">{apt.appointmentDate}</p>
                      <p className="text-[11px] text-emerald-600 font-semibold">{apt.startTime} - {apt.endTime}</p>
                    </TableCell>

                    <TableCell>
                      <p className="text-xs text-gray-600 truncate max-w-xs">{apt.reasonForVisit || 'General review'}</p>
                    </TableCell>

                    <TableCell>
                      <StatusBadge status={apt.status} />
                    </TableCell>

                    <TableCell className="text-right pr-6">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate('/doctor/appointments')}
                        className="text-xs text-emerald-600 hover:text-emerald-700 h-8"
                      >
                        Open
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-gray-400 text-xs">
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
