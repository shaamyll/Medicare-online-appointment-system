import React, { useState } from 'react';
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
  CreditCard,
  Eye,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { PageHeader } from '@/components/ui/PageHeader';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell, TableHeadSerial, TableCellSerial } from '@/components/ui/Table';
import { useAdminStats } from '@/features/admin/hooks/useAdmin';
import { LoadingState } from '@/components/ui/LoadingState';
import { DoctorDetailsModal } from './DoctorDetailsModal';

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: stats, isLoading } = useAdminStats();
  const [selectedDoctorId, setSelectedDoctorId] = useState<number | null>(null);

  if (isLoading) {
    return <LoadingState message="Loading administrative intelligence..." />;
  }

  const totalRevenue = stats?.payment?.totalRevenue ?? stats?.totalRevenue ?? 0;
  const paidCount = stats?.payment?.paidCount ?? stats?.paidCount ?? 0;
  const unpaidCount = stats?.payment?.unpaidCount ?? stats?.unpaidCount ?? 0;
  const refundedCount = stats?.payment?.refundedCount ?? stats?.refundedCount ?? 0;
  const doctorRevenueList = (stats?.doctorRevenue ?? []).filter(
    (doc) => doc.totalAppointments > 0 || doc.totalEarned > 0
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <PageHeader
        title="Platform Operations Overview"
        subtitle="Real-time consultation oversight and healthcare provider administration"
        badge={<Badge variant="success">Live Data</Badge>}
        actions={
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/admin/doctor-requests')}
              className="relative"
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
            >
              All Appointments
            </Button>
          </div>
        }
      />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        <Card hover className="border-gray-200 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Active Doctors</p>
              <p className="text-2xl font-black text-gray-900 mt-1">{stats?.totalDoctors ?? 0}</p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <Stethoscope className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-emerald-600 font-medium mt-3 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Approved & Practicing
          </p>
        </Card>

        <Card hover className="border-gray-200 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Pending Approvals</p>
              <p className={`text-2xl font-black mt-1 ${stats && stats.pendingApprovals > 0 ? 'text-amber-600' : 'text-gray-900'}`}>
                {stats?.pendingApprovals ?? 0}
              </p>
            </div>
            <div className={`p-3 rounded-xl ${stats && stats.pendingApprovals > 0 ? 'bg-amber-50 text-amber-600' : 'bg-gray-100 text-gray-500'}`}>
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

        <Card hover className="border-gray-200 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Total Patients</p>
              <p className="text-2xl font-black text-gray-900 mt-1">{stats?.totalPatients ?? 0}</p>
            </div>
            <div className="p-3 bg-sky-50 text-sky-600 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3 font-medium">Registered user base</p>
        </Card>

        <Card hover className="border-gray-200 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Today's Visits</p>
              <p className="text-2xl font-black text-gray-900 mt-1">{stats?.todayAppointments ?? 0}</p>
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-indigo-600 mt-3 font-medium">Scheduled today</p>
        </Card>

        <Card hover className="border-gray-200 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Upcoming Visits</p>
              <p className="text-2xl font-black text-emerald-600 mt-1">{stats?.upcomingAppointments ?? 0}</p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3 font-medium">Future confirmed shifts</p>
        </Card>
      </div>

      {/* Revenue & Payment Intelligence (Demo Gateway) */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Platform Consultation Revenue & Payments</h2>
              <p className="text-xs text-gray-500">Real-time settlement status of provider consultation fees and patient transactions</p>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-gray-400 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-200">
            Demo Payment Tracking
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-100">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
              Total Revenue (Collected)
            </span>
            <div className="text-2xl font-black text-emerald-950 mt-1">
              Rs. {Number(totalRevenue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-emerald-700 mt-1 font-medium">Across all paid consultations</p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-gray-200">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
              Paid Appointments
            </span>
            <div className="text-2xl font-black text-emerald-600 mt-1">
              {paidCount}
            </div>
            <p className="text-[11px] text-gray-500 mt-1 font-medium">Fully settled consultation fees</p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-gray-200">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
              Unpaid Invoices
            </span>
            <div className="text-2xl font-black text-amber-600 mt-1">
              {unpaidCount}
            </div>
            <p className="text-[11px] text-gray-500 mt-1 font-medium">Pending patient settlement</p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-gray-200">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
              Refunded Amounts
            </span>
            <div className="text-2xl font-black text-gray-700 mt-1">
              {refundedCount}
            </div>
            <p className="text-[11px] text-gray-500 mt-1 font-medium">Cancelled/declined bookings</p>
          </div>
        </div>

        {/* Doctor Earnings & Paid Consultation Breakdown */}
        {doctorRevenueList.length > 0 && (
          <div className="mt-6 pt-5 border-t border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                  Provider Earnings & Settlement Breakdown
                </h3>
                <p className="text-[11px] text-gray-500">
                  Revenue collected across registered independent and clinic physicians for completed consultations
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/admin/doctors')}
                className="text-xs text-brand-600 hover:text-brand-700"
              >
                All Providers &rarr;
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 uppercase text-[10px] font-bold tracking-wider">
                    <th className="py-2.5 px-3">Physician</th>
                    <th className="py-2.5 px-3">Department</th>
                    <th className="py-2.5 px-3 text-center">Paid Visits</th>
                    <th className="py-2.5 px-3 text-center">Total Visits</th>
                    <th className="py-2.5 px-3 text-right">Revenue Earned</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {doctorRevenueList.map((doc) => {
                    const share = totalRevenue > 0 ? ((doc.totalEarned / totalRevenue) * 100).toFixed(1) : '0';
                    return (
                      <tr key={doc.doctorId} className="hover:bg-gray-50/70 transition-colors">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            <Avatar
                              src={doc.thumbnailPath || doc.imagePath}
                              name={doc.doctorName}
                              size="sm"
                            />
                            <div>
                              <p className="font-bold text-gray-900 leading-tight">{doc.doctorName}</p>
                              <p className="text-[11px] text-gray-500 leading-tight">{doc.specialization}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-gray-100 text-gray-700">
                            {doc.departmentName || 'General'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-emerald-600">
                          {doc.paidAppointments}
                        </td>
                        <td className="py-3 px-3 text-center text-gray-500">
                          {doc.totalAppointments}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="font-extrabold text-gray-900">
                            Rs. {doc.totalEarned.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                          {doc.totalEarned > 0 && (
                            <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                              {share}% of platform revenue
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedDoctorId(doc.doctorId)}
                            className="text-xs h-7 px-2.5"
                            leftIcon={<Eye className="w-3.5 h-3.5 mr-1 text-gray-500" />}
                          >
                            View
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Quick Navigation Panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card hover className="p-6 flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
              <Stethoscope className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-gray-900">Manage Providers & Shifts</h3>
            <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
              View registered independent and clinic physicians, assign specialties, examine consultation fees, and toggle access states.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/admin/doctors')}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            className="mt-5 w-full justify-between"
          >
            <span>Provider Directory</span>
          </Button>
        </Card>

        <Card hover className="p-6 flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-gray-900">Doctor Registration Queue</h3>
            <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
              Verify credentials, medical licenses, and practice details for newly registered independent and clinic doctors.
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
            <h3 className="text-base font-bold text-gray-900">Medical Specialties & Departments</h3>
            <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
              Configure medical specialties (Cardiology, Neurology, Pediatrics, etc.) available for provider registrations.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/admin/departments')}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            className="mt-5 w-full justify-between"
          >
            <span>Specialties Setup</span>
          </Button>
        </Card>
      </div>

      {/* Recent Appointments Preview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-gray-100">
          <div>
            <CardTitle>Recent Appointments</CardTitle>
            <p className="text-xs text-gray-500 mt-0.5">Most recent consultations booked across registered physicians and clinics</p>
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
                    <TableCell className="font-mono text-xs font-semibold text-gray-800">
                      {apt.appointmentNumber}
                    </TableCell>
                    <TableCell className="font-medium text-gray-900">{apt.patientName}</TableCell>
                    <TableCell className="text-gray-800">{apt.doctorName}</TableCell>
                    <TableCell className="text-gray-600">{apt.departmentName || 'General'}</TableCell>
                    <TableCell className="text-xs text-gray-600">
                      {apt.appointmentDate} at {apt.startTime}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={apt.status} />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-gray-400 text-xs">
                    No appointments booked yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Doctor Dossier Modal */}
      <DoctorDetailsModal
        doctorId={selectedDoctorId}
        isOpen={!!selectedDoctorId}
        onClose={() => setSelectedDoctorId(null)}
      />
    </div>
  );
};
