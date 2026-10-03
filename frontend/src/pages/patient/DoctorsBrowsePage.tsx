import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { DoctorCard } from '@/features/doctors/components/DoctorCard';
import { DoctorCardSkeleton } from '@/features/doctors/components/DoctorCardSkeleton';
import { useDoctors } from '@/features/doctors/hooks/useDoctors';
import { useDepartments } from '@/features/departments/hooks/useDepartments';
import { AppointmentBookingModal } from '@/features/appointments/components/AppointmentBookingModal';
import { DoctorDetailsModal } from '@/features/doctors/components/DoctorDetailsModal';
import { Doctor } from '@/features/doctors/types/doctor.types';

export const DoctorsBrowsePage: React.FC = () => {
  const [selectedDeptId, setSelectedDeptId] = useState<number | undefined>(undefined);
  const [search, setSearch] = useState('');
  const [bookingDoctorId, setBookingDoctorId] = useState<number | null>(null);
  const [selectedDoctorForDetails, setSelectedDoctorForDetails] = useState<Doctor | null>(null);

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
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <DoctorCardSkeleton key={i} />
          ))}
        </div>
      ) : !doctors || doctors.length === 0 ? (
        <Card className="p-12 text-center">
          <EmptyState
            title="No Doctors Found"
            description="No medical specialists matched your selected department or search filter. Try clearing your search or switching departments."
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {doctors.map((doc) => (
            <DoctorCard
              key={doc.id}
              doctor={doc}
              onBook={(doctorId) => setBookingDoctorId(doctorId)}
              onViewProfile={(doctor) => setSelectedDoctorForDetails(doctor)}
            />
          ))}
        </div>
      )}

      {/* Doctor Details Modal with Full High-Res Photo & Credentials */}
      <DoctorDetailsModal
        isOpen={selectedDoctorForDetails !== null}
        onClose={() => setSelectedDoctorForDetails(null)}
        doctor={selectedDoctorForDetails}
        onBookAppointment={(id) => setBookingDoctorId(id)}
      />

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
