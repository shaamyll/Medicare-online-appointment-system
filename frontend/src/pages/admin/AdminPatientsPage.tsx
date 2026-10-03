import React, { useState } from 'react';
import { Search, Calendar, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell, TableHeadSerial, TableCellSerial } from '@/components/ui/Table';
import { LoadingState } from '@/components/ui/LoadingState';
import { useAdminPatients } from '@/features/admin/hooks/useAdmin';

export const AdminPatientsPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const { data: patients, isLoading, isError, error, refetch } = useAdminPatients();

  const filteredPatients = (patients || []).filter((p) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return p.name.toLowerCase().includes(term) || p.email.toLowerCase().includes(term);
  });

  if (isLoading) {
    return <LoadingState message="Fetching patient accounts..." />;
  }

  if (isError) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-rose-200 shadow-sm space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900">Failed to load patients</h3>
          <p className="text-sm text-slate-500 mt-1">
            {(error as any)?.message || 'An error occurred while fetching patients.'}
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Registered Patients</h1>
          <p className="text-sm text-slate-500">
            Patients registered in Medi-Care with their contact information and appointment history counts
          </p>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search patients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500 w-56 transition"
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeadSerial />
                <TableHead>Patient Name</TableHead>
                <TableHead>Contact Information</TableHead>
                <TableHead>Appointments Booked</TableHead>
                <TableHead>Registration Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPatients.length > 0 ? (
                filteredPatients.map((p, idx) => (
                  <TableRow key={p.id}>
                    <TableCellSerial index={idx} />
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-700 font-bold text-xs">
                          {p.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 text-sm">{p.name}</p>
                          <p className="text-xs text-slate-400">ID #{p.id}</p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <p className="text-xs text-slate-800">{p.email}</p>
                      <p className="text-[11px] text-slate-500">{p.phone || 'No phone recorded'}</p>
                    </TableCell>

                    <TableCell>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-xs font-semibold text-slate-800">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        {p.appointmentCount} Visits
                      </span>
                    </TableCell>

                    <TableCell className="text-xs text-slate-600">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </TableCell>

                    <TableCell>
                      <StatusBadge status="active" />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-slate-400 text-xs">
                    No patients match your search.
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

