import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/Table';
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">My Consultation Patients</h1>
          <p className="text-sm text-slate-500">
            Patients who have scheduled visits with you across all department clinics
          </p>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search patients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-teal-500 w-56"
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Contact Information</TableHead>
                <TableHead>Total Consultations</TableHead>
                <TableHead>Last Visit Date</TableHead>
                <TableHead>Last Symptoms / Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {patients.length > 0 ? (
                patients.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 font-bold text-xs">
                          {p.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 text-sm">{p.name}</p>
                          <p className="text-xs text-slate-400">Patient ID #{p.id}</p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <p className="text-xs text-slate-800">{p.email}</p>
                      <p className="text-[11px] text-teal-700 font-medium">{p.phone || 'No phone recorded'}</p>
                    </TableCell>

                    <TableCell>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-50 text-xs font-semibold text-teal-800 border border-teal-100">
                        {p.totalVisits} Consultations
                      </span>
                    </TableCell>

                    <TableCell className="text-xs font-medium text-slate-900">
                      {p.lastVisit}
                    </TableCell>

                    <TableCell>
                      <p className="text-xs text-slate-600 truncate max-w-xs">
                        {p.lastReason || 'Routine health evaluation'}
                      </p>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-slate-400 text-xs">
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
