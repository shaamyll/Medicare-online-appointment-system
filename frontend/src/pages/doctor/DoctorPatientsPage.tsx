import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { FilterBar } from '@/components/ui/FilterBar';
import { SearchInput } from '@/components/ui/SearchInput';
import { Avatar } from '@/components/ui/Avatar';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell, TableHeadSerial, TableCellSerial } from '@/components/ui/Table';
import { LoadingState } from '@/components/ui/LoadingState';
import { useAppointments } from '@/features/appointments/hooks/useAppointments';

export const DoctorPatientsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: appointments, isLoading } = useAppointments();

  if (isLoading) {
    return <LoadingState message="Loading patient list..." />;
  }

  // Extract distinct patients from appointments
  const patientMap = new Map<number, {
    id: number;
    name: string;
    email: string;
    phone?: string;
    gender?: string | null;
    age?: number | null;
    totalVisits: number;
    lastVisit: string;
    lastReason?: string;
  }>();

  (appointments || []).forEach((apt) => {
    const existing = patientMap.get(apt.patient.id);
    if (!existing) {
      patientMap.set(apt.patient.id, {
        id: apt.patient.id,
        name: apt.patient.name,
        email: apt.patient.email,
        phone: apt.patient.phone,
        gender: apt.patient.gender,
        age: apt.patient.age,
        totalVisits: 1,
        lastVisit: apt.appointmentDate,
        lastReason: apt.reasonForVisit,
      });
    } else {
      existing.totalVisits += 1;
      if (apt.appointmentDate > existing.lastVisit) {
        existing.lastVisit = apt.appointmentDate;
        existing.lastReason = apt.reasonForVisit;
      }
    }
  });

  const patients = Array.from(patientMap.values()).filter((p) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return p.name.toLowerCase().includes(term) || p.email.toLowerCase().includes(term);
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Consultation Patients"
        subtitle="Patients who have scheduled visits with you across all department clinics"
        badge={
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            {patients.length} {patients.length === 1 ? 'Patient' : 'Patients'}
          </span>
        }
      />

      <FilterBar>
        <div className="w-full sm:w-80">
          <SearchInput
            placeholder="Search patients by name or email..."
            value={searchTerm}
            onChange={(val) => setSearchTerm(val)}
          />
        </div>
      </FilterBar>

      <Card className="rounded-xl border-gray-200 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeadSerial />
                <TableHead>Patient</TableHead>
                <TableHead>Contact Information</TableHead>
                <TableHead>Total Consultations</TableHead>
                <TableHead>Last Visit Date</TableHead>
                <TableHead>Last Symptoms / Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {patients.length > 0 ? (
                patients.map((p, idx) => (
                  <TableRow key={p.id} className="hover:bg-gray-50 transition-colors">
                    <TableCellSerial index={idx} />
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar name={p.name} size="sm" shape="circle" />
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-900 text-sm">{p.name}</p>
                            {p.age !== undefined && p.age !== null && (
                              <span className="text-[10px] font-semibold text-gray-600 bg-gray-100 border border-gray-200 px-1.5 py-0.2 rounded-md">
                                {p.age}y{p.gender ? ` • ${p.gender}` : ''}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400">Patient ID #{p.id}</p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <p className="text-xs text-gray-800">{p.email}</p>
                      <p className="text-[11px] text-emerald-700 font-medium">{p.phone || 'No phone recorded'}</p>
                    </TableCell>

                    <TableCell>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-xs font-semibold text-emerald-800 border border-emerald-100">
                        {p.totalVisits} Consultations
                      </span>
                    </TableCell>

                    <TableCell className="text-xs font-medium text-gray-900">
                      {p.lastVisit}
                    </TableCell>

                    <TableCell>
                      <p className="text-xs text-gray-600 truncate max-w-xs">
                        {p.lastReason || 'Routine health evaluation'}
                      </p>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-gray-400 text-xs">
                    No patients have scheduled consultations with you yet.
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
