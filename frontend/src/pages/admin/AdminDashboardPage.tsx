import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Stethoscope,
  Clock,
  Calendar,
  Building2,
  CheckCircle2,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell, TableHeadSerial, TableCellSerial } from '@/components/ui/Table';
import { useAdminStats } from '@/features/admin/hooks/useAdmin';
import { LoadingState } from '@/components/ui/LoadingState';

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: stats, isLoading } = useAdminStats();

  if (isLoading) {
    return <LoadingState message="Loading administrative intelligence..." />;
  }

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Hospital Operations Overview
            </h1>
            <Badge variant="success">Live Data</Badge>
          </div>
          <p className="text-sm text-slate-500">
            Real-time appointment schedule oversight and medical staff administration
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/admin/doctor-requests')}
            className="border-slate-300 relative"
          >
            Review Doctor Requests
            {stats && stats.pendingApprovals > 0 && (
              <span className="ml-2 px-1.5 py-0.5 text-[10px] font-extrabold rounded-full bg-amber-500 text-white">
                {stats.pendingApprovals}
              </span>
            )}
          </Button>
          <Button
            size="sm"
            onClick={() => navigate('/admin/appointments')}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            All Appointments
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        <Card hover className="border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Active Doctors</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{stats?.totalDoctors ?? 0}</p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <Stethoscope className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-emerald-600 font-medium mt-3 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Approved & Practicing
          </p>
        </Card>

        <Card hover className="border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Pending Approvals</p>
              <p className={`text-2xl font-black mt-1 ${stats && stats.pendingApprovals > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
                {stats?.pendingApprovals ?? 0}
              </p>
            </div>
            <div className={`p-3 rounded-xl ${stats && stats.pendingApprovals > 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <button
            onClick={() => navigate('/admin/doctor-requests')}
            className="text-xs text-amber-600 hover:text-amber-700 font-semibold mt-3 inline-flex items-center gap-1"
          >
            Requires verification &rarr;
          </button>
        </Card>

        <Card hover className="border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Patients</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{stats?.totalPatients ?? 0}</p>
            </div>
            <div className="p-3 bg-sky-50 text-sky-600 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3 font-medium">Registered user base</p>
        </Card>

        <Card hover className="border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Today's Visits</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{stats?.todayAppointments ?? 0}</p>
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-indigo-600 mt-3 font-medium">Scheduled today</p>
        </Card>

        <Card hover className="border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Upcoming Visits</p>
              <p className="text-2xl font-black text-emerald-600 mt-1">{stats?.upcomingAppointments ?? 0}</p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3 font-medium">Future confirmed shifts</p>
        </Card>
      </div>

      {/* Quick Navigation Panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card hover className="p-6 flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
              <Stethoscope className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Manage Doctors & Shifts</h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              View active physicians, assign clinical departments, examine consultation fees, and toggle access states.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/admin/doctors')}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            className="mt-5 w-full justify-between"
          >
            <span>Physician Directory</span>
          </Button>
        </Card>

        <Card hover className="p-6 flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Doctor Approval Queue</h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Verify credentials, qualifications, and department affiliations for newly registered medical practitioners.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/admin/doctor-requests')}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            className="mt-5 w-full justify-between"
          >
            <span>Review Pending Requests</span>
          </Button>
        </Card>

        <Card hover className="p-6 flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center mb-4">
              <Building2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Clinical Departments</h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Configure medical divisions (Cardiology, Neurology, Pediatrics, etc.) and assign clinical icons.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/admin/departments')}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            className="mt-5 w-full justify-between"
          >
            <span>Departments Setup</span>
          </Button>
        </Card>
      </div>

      {/* Recent Appointments Preview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <CardTitle>Recent Appointments</CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">Most recent appointments booked across all hospital departments</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin/appointments')}
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
                <TableHead>Patient</TableHead>
                <TableHead>Doctor</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats?.recentAppointments && stats.recentAppointments.length > 0 ? (
                stats.recentAppointments.map((apt: any, idx: number) => (
                  <TableRow key={apt.id}>
                    <TableCellSerial index={idx} />
                    <TableCell className="font-mono text-xs font-semibold text-slate-800">
                      {apt.appointmentNumber}
                    </TableCell>
                    <TableCell className="font-medium text-slate-900">{apt.patientName}</TableCell>
                    <TableCell className="text-slate-800">{apt.doctorName}</TableCell>
                    <TableCell className="text-slate-600">{apt.departmentName || 'General'}</TableCell>
                    <TableCell className="text-xs text-slate-600">
                      {apt.appointmentDate} at {apt.startTime}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={apt.status} />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-slate-400 text-xs">
                    No appointments booked yet.
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
