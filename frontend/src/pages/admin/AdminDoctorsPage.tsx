import React, { useState, useMemo } from 'react';
import { PowerOff, Power, Trash2, AlertCircle, Eye } from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Avatar } from '@/components/ui/Avatar';
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
import { PageHeader } from '@/components/ui/PageHeader';
import { FilterBar } from '@/components/ui/FilterBar';
import { SearchInput } from '@/components/ui/SearchInput';
import { Select } from '@/components/ui/Select';
import { IconButton } from '@/components/ui/IconButton';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/LoadingState';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { DoctorDetailsModal } from './DoctorDetailsModal';
import { useToast } from '@/components/ui/Toast';
import {
  useAdminDoctors,
  useToggleDoctorStatus,
  useDeleteDoctor,
  useDoctorDeleteImpact,
} from '@/features/admin/hooks/useAdmin';

export const AdminDoctorsPage: React.FC = () => {
  const { toast } = useToast();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Modals state
  const [detailsDoctorId, setDetailsDoctorId] = useState<number | null>(null);
  const [deactivatingDoctor, setDeactivatingDoctor] = useState<{ id: number; name: string } | null>(null);
  const [deletingDoctor, setDeletingDoctor] = useState<{
    id: number;
    name: string;
    email: string;
    photo?: string;
  } | null>(null);

  const { data: doctors, isLoading, isError, error, refetch } = useAdminDoctors(
    filterStatus === 'all' ? undefined : filterStatus
  );
  const toggleStatusMutation = useToggleDoctorStatus();
  const deleteMutation = useDeleteDoctor();

  // Delete impact query
  const { data: deleteImpact, isLoading: isLoadingImpact } = useDoctorDeleteImpact(
    deletingDoctor?.id ?? 0,
    !!deletingDoctor
  );

  const handleDeactivateConfirm = async () => {
    if (!deactivatingDoctor) return;
    try {
      await toggleStatusMutation.mutateAsync({ id: deactivatingDoctor.id, status: 'inactive' });
      toast(`Dr. ${deactivatingDoctor.name} has been deactivated.`, 'success');
      setDeactivatingDoctor(null);
    } catch (err: any) {
      toast(err.response?.data?.message || err.message || 'Failed to deactivate doctor', 'error');
    }
  };

  const handleActivate = async (id: number, name: string) => {
    try {
      await toggleStatusMutation.mutateAsync({ id, status: 'active' });
      toast(`Dr. ${name} is now active.`, 'success');
    } catch (err: any) {
      toast(err.response?.data?.message || err.message || 'Failed to activate doctor', 'error');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingDoctor) return;
    try {
      await deleteMutation.mutateAsync(deletingDoctor.id);
      toast(`Dr. ${deletingDoctor.name} and their clinical record have been removed.`, 'success');
      setDeletingDoctor(null);
    } catch (err: any) {
      toast(err.response?.data?.message || err.message || 'Failed to delete doctor account', 'error');
    }
  };

  const isMutatingStatus = toggleStatusMutation.isPending || deleteMutation.isPending;

  const filteredDoctors = useMemo(() => {
    if (!doctors) return [];
    if (!searchTerm.trim()) return doctors;
    const term = searchTerm.toLowerCase();
    return doctors.filter(
      (doc) =>
        doc.name.toLowerCase().includes(term) ||
        (doc.specialization && doc.specialization.toLowerCase().includes(term)) ||
        doc.email.toLowerCase().includes(term) ||
        (doc.departmentName && doc.departmentName.toLowerCase().includes(term)) ||
        (doc.licenseNumber && doc.licenseNumber.toLowerCase().includes(term))
    );
  }, [doctors, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredDoctors.length / pageSize));
  const paginatedDoctors = filteredDoctors.slice((page - 1) * pageSize, page * pageSize);

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'active', label: 'Active Only', dot: 'bg-emerald-500' },
    { value: 'pending', label: 'Pending', dot: 'bg-amber-500' },
    { value: 'inactive', label: 'Inactive', dot: 'bg-gray-400' },
    { value: 'rejected', label: 'Rejected', dot: 'bg-rose-500' },
  ];

  if (isLoading) {
    return <LoadingState message="Loading registered healthcare providers..." />;
  }

  if (isError) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-rose-200 shadow-xs space-y-3">
        <AlertCircle className="h-10 w-10 text-rose-500 mx-auto" />
        <h3 className="text-base font-bold text-gray-900">Failed to load healthcare providers</h3>
        <p className="text-xs text-gray-500 max-w-md mx-auto">
          {(error as any)?.message || 'An error occurred while fetching the doctors directory.'}
        </p>
        <Button variant="secondary" size="sm" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Registered Healthcare Providers"
        subtitle="Directory of registered independent and clinic doctors, specialties, and practice statuses"
      />

      {/* Filter Bar */}
      <FilterBar>
        <div className="flex-1 min-w-[240px]">
          <SearchInput
            value={searchTerm}
            onChange={(val) => {
              setSearchTerm(val);
              setPage(1);
            }}
            placeholder="Search by name, spec, license..."
          />
        </div>

        <div className="w-full sm:w-48">
          <Select
            value={filterStatus}
            onChange={(val) => {
              setFilterStatus(val);
              setPage(1);
            }}
            options={statusOptions}
            placeholder="All Statuses"
          />
        </div>
      </FilterBar>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeadSerial />
              <TableHead>Doctor</TableHead>
              <TableHead>Specialization & Dept</TableHead>
              <TableHead>Experience & Fee</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right pr-6">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedDoctors.length > 0 ? (
              paginatedDoctors.map((doc, idx) => (
                <TableRow key={doc.id}>
                  <TableCellSerial index={(page - 1) * pageSize + idx} />
                  <TableCell>
                    <div
                      className="flex items-center gap-3 cursor-pointer group"
                      onClick={() => setDetailsDoctorId(doc.id)}
                      title="Click to view full dossier"
                    >
                      <Avatar
                        src={doc.thumbnailPath || doc.imagePath}
                        name={doc.name}
                        size="md"
                        shape="rounded"
                        version={doc.updatedAt}
                      />
                      <div>
                        <p className="font-bold text-gray-900 text-sm group-hover:text-emerald-700 transition-colors">
                          Dr. {doc.name}
                        </p>
                        <p className="text-xs text-gray-500">{doc.email}</p>
                        {doc.phone && <p className="text-[11px] text-gray-400">{doc.phone}</p>}
                        {doc.licenseNumber && (
                          <span className="inline-block mt-0.5 text-[10px] font-mono font-semibold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded border border-gray-200">
                            Lic: {doc.licenseNumber}
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <p className="font-semibold text-emerald-700 text-xs">{doc.specialization}</p>
                    <p className="text-xs text-gray-500">{doc.departmentName || 'Unassigned'}</p>
                    {doc.qualification && (
                      <p className="text-[11px] text-gray-400 mt-0.5">{doc.qualification}</p>
                    )}
                  </TableCell>

                  <TableCell>
                    <p className="text-xs text-gray-800 font-semibold">
                      Rs. {Number(doc.consultationFee || 0).toFixed(0)}
                    </p>
                    <p className="text-[11px] text-gray-500">{doc.experienceYears || 0} Years Practice</p>
                  </TableCell>

                  <TableCell>
                    <StatusBadge status={doc.status} />
                  </TableCell>

                  <TableCell className="text-right pr-6">
                    <div className="flex items-center justify-end gap-2">
                      {/* View Details Eye Button */}
                      <IconButton
                        variant="outline"
                        size="sm"
                        icon={<Eye className="h-4 w-4 text-sky-600" />}
                        title="View details"
                        aria-label="View details"
                        onClick={() => setDetailsDoctorId(doc.id)}
                        className="border-sky-200 hover:bg-sky-50 shadow-2xs"
                      />

                      {doc.status === 'active' ? (
                        <IconButton
                          variant="danger"
                          size="sm"
                          icon={<PowerOff className="h-4 w-4" />}
                          title="Deactivate doctor"
                          aria-label="Deactivate doctor"
                          onClick={() => setDeactivatingDoctor({ id: doc.id, name: doc.name })}
                          disabled={isMutatingStatus}
                        />
                      ) : (
                        <IconButton
                          variant="success"
                          size="sm"
                          icon={<Power className="h-4 w-4" />}
                          title="Activate doctor"
                          aria-label="Activate doctor"
                          onClick={() => handleActivate(doc.id, doc.name)}
                          disabled={isMutatingStatus}
                        />
                      )}

                      <IconButton
                        variant="ghost"
                        size="sm"
                        icon={<Trash2 className="h-4 w-4 text-gray-400 hover:text-rose-600" />}
                        title="Delete doctor"
                        aria-label="Delete doctor"
                        onClick={() =>
                          setDeletingDoctor({
                            id: doc.id,
                            name: doc.name,
                            email: doc.email,
                            photo: (doc.thumbnailPath || doc.imagePath) || undefined,
                          })
                        }
                        disabled={isMutatingStatus}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center">
                  <div className="flex flex-col items-center justify-center text-gray-400">
                    <p className="text-sm font-medium">No doctors found matching filters</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {totalPages > 1 && (
          <TablePagination
            page={page}
            totalPages={totalPages}
            totalItems={filteredDoctors.length}
            pageSize={pageSize}
            onPageChange={(p) => setPage(p)}
          />
        )}
      </div>

      {/* Deactivate Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deactivatingDoctor}
        onClose={() => setDeactivatingDoctor(null)}
        onConfirm={handleDeactivateConfirm}
        title="Deactivate Doctor"
        description={`Are you sure you want to deactivate Dr. ${deactivatingDoctor?.name}? They will no longer be bookable by patients until reactivated.`}
        confirmLabel="Deactivate Doctor"
        variant="warning"
        isLoading={toggleStatusMutation.isPending}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingDoctor}
        onClose={() => setDeletingDoctor(null)}
        onConfirm={handleDeleteConfirm}
        title="Permanently Delete Doctor"
        description={
          <div className="space-y-3">
            <p>
              Are you sure you want to permanently delete <strong>Dr. {deletingDoctor?.name}</strong>?
            </p>
            {isLoadingImpact ? (
              <p className="text-xs text-gray-400 italic">Calculating dependent records...</p>
            ) : deleteImpact ? (
              <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 space-y-1">
                <p className="font-bold">This will permanently delete:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>{(deleteImpact as any).totalAppointments ?? (deleteImpact as any).appointmentsCount ?? 0} appointments</li>
                  <li>{(deleteImpact as any).upcomingAppointments ?? (deleteImpact as any).schedulesCount ?? 0} upcoming / schedules</li>
                  <li>Doctor profile and medical license records</li>
                </ul>
              </div>
            ) : null}
          </div>
        }
        confirmLabel="Yes, Delete Doctor"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />

      {/* Doctor Dossier Details Modal */}
      <DoctorDetailsModal
        doctorId={detailsDoctorId}
        isOpen={!!detailsDoctorId}
        onClose={() => setDetailsDoctorId(null)}
      />
    </div>
  );
};
