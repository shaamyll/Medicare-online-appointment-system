import React, { useState } from 'react';
import {
  Search,
  Calendar,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { useDoctors } from '@/features/doctors/hooks/useDoctors';
import { useDepartments } from '@/features/departments/hooks/useDepartments';
import { AppointmentBookingModal } from '@/features/appointments/components/AppointmentBookingModal';

export const DoctorsBrowsePage: React.FC = () => {
  const [selectedDeptId, setSelectedDeptId] = useState<number | undefined>(undefined);
  const [search, setSearch] = useState('');
  const [bookingDoctorId, setBookingDoctorId] = useState<number | null>(null);

  const { data: departments } = useDepartments();
  const { data: doctors, isLoading } = useDoctors({
    departmentId: selectedDeptId,
    search: search || undefined,
  });

  if (isLoading) {
    return <LoadingState message="Loading medical specialists..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Medical Specialists Directory</h1>
          <p className="text-sm text-slate-500">
            Browse verified hospital doctors, view credentials, and book consultation time slots
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by doctor, specialization..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500 w-60"
            />
          </div>

          <select
            value={selectedDeptId || ''}
            onChange={(e) => setSelectedDeptId(e.target.value ? Number(e.target.value) : undefined)}
            className="text-xs py-1.5 px-3 rounded-lg border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:border-emerald-500"
          >
            <option value="">All Departments</option>
            {departments?.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Doctors Grid */}
      {!doctors || doctors.length === 0 ? (
        <Card className="p-8">
          <EmptyState
            title="No Doctors Found"
            description="No medical specialists matched your department or search query. Try choosing another department."
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map((doc) => (
            <Card key={doc.id} hover className="border-slate-200/90 flex flex-col justify-between">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-base shadow-sm">
                      {doc.user.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{doc.user.name}</h3>
                      <p className="text-xs text-emerald-700 font-semibold">{doc.specialization}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-slate-600">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                    <span className="text-slate-400">Department:</span>
                    <span className="font-semibold text-slate-800">{doc.department?.name || 'General Clinic'}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                    <span className="text-slate-400">Experience:</span>
                    <span className="font-semibold text-slate-800">{doc.experienceYears} Years Clinical</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                    <span className="text-slate-400">Consultation Fee:</span>
                    <span className="font-bold text-emerald-700">${doc.consultationFee?.toFixed(2)}</span>
                  </div>
                </div>

                {doc.bio && (
                  <p className="text-xs text-slate-500 mt-4 line-clamp-2 leading-relaxed">
                    {doc.bio}
                  </p>
                )}
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3 rounded-b-xl">
                <span className="text-[11px] text-slate-400 font-medium">
                  {doc.roomNumber || 'Outpatient Clinic'}
                </span>
                <Button
                  size="sm"
                  onClick={() => setBookingDoctorId(doc.id)}
                  leftIcon={<Calendar className="w-3.5 h-3.5" />}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                >
                  Book Visit
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Appointment Booking Modal */}
      {bookingDoctorId !== null && (
        <AppointmentBookingModal
          isOpen={bookingDoctorId !== null}
          onClose={() => setBookingDoctorId(null)}
          preselectedDoctorId={bookingDoctorId}
        />
      )}
    </div>
  );
};
