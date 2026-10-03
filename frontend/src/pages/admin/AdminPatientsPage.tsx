import React, { useState, useMemo } from 'react';
import { Calendar, AlertCircle } from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { PageHeader } from '@/components/ui/PageHeader';
import { FilterBar } from '@/components/ui/FilterBar';
import { SearchInput } from '@/components/ui/SearchInput';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  TableHeadSerial,
  TableCellSerial,
  TablePagination,
} from '@/components/ui/Table';
import { LoadingState } from '@/components/ui/LoadingState';
import { useAdminPatients } from '@/features/admin/hooks/useAdmin';

export const AdminPatientsPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data: patients, isLoading, isError, error, refetch } = useAdminPatients();

  const filteredPatients = useMemo(() => {
    if (!patients) return [];
    if (!search.trim()) return patients;
    const term = search.toLowerCase();
    return patients.filter((p) => p.name.toLowerCase().includes(term) || p.email.toLowerCase().includes(term));
  }, [patients, search]);

  const totalPages = Math.max(1, Math.ceil(filteredPatients.length / pageSize));
  const paginatedPatients = filteredPatients.slice((page - 1) * pageSize, page * pageSize);

  if (isLoading) {
    return <LoadingState message="Fetching patient accounts..." />;
  }

  if (isError) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-rose-200 shadow-xs space-y-3">
        <AlertCircle className="h-10 w-10 text-rose-500 mx-auto" />
        <h3 className="text-base font-bold text-gray-900">Failed to load patients</h3>
        <p className="text-xs text-gray-500 max-w-sm mx-auto">
          {(error as any)?.message || 'An error occurred while fetching patients.'}
        </p>
        <Button variant="secondary" size="sm" onClick={() => refetch()}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Registered Patients"
        subtitle="Patients registered in Medi-Care with their contact information and appointment history counts"
      />

      {/* Filter Bar */}
      <FilterBar>
        <div className="w-full sm:max-w-md">
          <SearchInput
            value={search}
            onChange={(val) => {
              setSearch(val);
              setPage(1);
            }}
            placeholder="Search patients by name or email..."
          />
        </div>
      </FilterBar>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        {filteredPatients.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title={search ? 'No Matching Patients' : 'No Patients Registered'}
              description={
                search
                  ? 'No patient records matched your search query.'
                  : 'There are currently no patient profiles in the system.'
              }
            />
          </div>
        ) : (
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
              {paginatedPatients.map((p, idx) => (
                <TableRow key={p.id}>
                  <TableCellSerial index={(page - 1) * pageSize + idx} />
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs shrink-0">
                        {p.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{p.name}</p>
                        <p className="text-xs text-gray-400">ID #{p.id}</p>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <p className="text-xs text-gray-800 font-medium">{p.email}</p>
                    <p className="text-[11px] text-gray-500">{p.phone || 'No phone recorded'}</p>
                  </TableCell>

                  <TableCell>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-100">
                      {(p as any).appointmentsCount ?? (p as any).appointmentCount ?? 0} Visits
                    </span>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                      <Calendar className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                      <span>{p.createdAt ? p.createdAt.split('T')[0] : 'N/A'}</span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <StatusBadge status="active" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {totalPages > 1 && (
          <TablePagination
            page={page}
            totalPages={totalPages}
            totalItems={filteredPatients.length}
            pageSize={pageSize}
            onPageChange={(p) => setPage(p)}
          />
        )}
      </div>
    </div>
  );
};
