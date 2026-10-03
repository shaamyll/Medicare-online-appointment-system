import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { FilterBar } from '@/components/ui/FilterBar';
import { SearchInput } from '@/components/ui/SearchInput';
import { Select } from '@/components/ui/Select';
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
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedDeptId, setSelectedDeptId] = useState<number | undefined>(undefined);
  const [search, setSearch] = useState('');
  const [bookingDoctorId, setBookingDoctorId] = useState<number | null>(null);
  const [selectedDoctorForDetails, setSelectedDoctorForDetails] = useState<Doctor | null>(null);

  // Auto-open booking modal if bookDoctor param is present (e.g. from login redirect)
  useEffect(() => {
    const bookDoctorParam = searchParams.get('bookDoctor');
    if (bookDoctorParam) {
      const docId = Number(bookDoctorParam);
      if (!isNaN(docId) && docId > 0) {
        setBookingDoctorId(docId);
      }
    }
  }, [searchParams]);

  const { data: departments } = useDepartments();
  const { data: doctors, isLoading } = useDoctors({
    departmentId: selectedDeptId,
    search: search || undefined,
  });

  const departmentOptions = useMemo(() => {
    const list = [{ value: '', label: 'All Departments' }];
    if (departments) {
      departments.forEach((d) => {
        list.push({ value: String(d.id), label: d.name });
      });
    }
    return list;
  }, [departments]);

  if (isLoading) {
    return <LoadingState message="Loading medical specialists..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Medical Specialists Directory"
        subtitle="Browse verified hospital doctors, view credentials, and book consultation time slots"
      />

      {/* Filter Toolbar */}
      <FilterBar>
        <div className="flex-1 min-w-[240px]">
          <SearchInput
            value={search}
            onChange={(val) => setSearch(val)}
            placeholder="Search by doctor, specialization..."
          />
        </div>

        <div className="w-full sm:w-60">
          <Select
            value={selectedDeptId !== undefined ? String(selectedDeptId) : ''}
            onChange={(val) => setSelectedDeptId(val ? Number(val) : undefined)}
            options={departmentOptions}
            searchable
            placeholder="All Departments"
          />
        </div>
      </FilterBar>

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
            actionLabel={search || selectedDeptId ? 'Clear Filters' : undefined}
            onAction={
              search || selectedDeptId
                ? () => {
                    setSearch('');
                    setSelectedDeptId(undefined);
                  }
                : undefined
            }
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
          onClose={() => {
            setBookingDoctorId(null);
            if (searchParams.has('bookDoctor')) {
              searchParams.delete('bookDoctor');
              setSearchParams(searchParams, { replace: true });
            }
          }}
          doctorId={bookingDoctorId}
        />
      )}
    </div>
  );
};
