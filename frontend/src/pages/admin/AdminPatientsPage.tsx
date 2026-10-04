import React, { useState, useMemo, useEffect } from 'react';
import { Calendar, AlertCircle, UserPlus, Trash2, Power, PowerOff, Eye, Mail, Phone, Hash } from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { PageHeader } from '@/components/ui/PageHeader';
import { FilterBar } from '@/components/ui/FilterBar';
import { SearchInput } from '@/components/ui/SearchInput';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
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
import { PatientCreateModal } from './PatientCreateModal';
import { CredentialsModal } from '@/components/ui/CredentialsModal';
import {
  useAdminPatients,
  usePatientDeleteImpact,
  useDeletePatient,
  useTogglePatientStatus,
} from '@/features/admin/hooks/useAdmin';
import { AdminPatient } from '@/features/admin/api/adminApi';

export const AdminPatientsPage: React.FC = () => {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [isAddPatientOpen, setIsAddPatientOpen] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{
    name: string;
    email: string;
    tempPassword: string;
  } | null>(null);

  // Deletion modal state
  const [deletingPatient, setDeletingPatient] = useState<AdminPatient | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Status toggle modal state
  const [deactivatingPatient, setDeactivatingPatient] = useState<AdminPatient | null>(null);

  // View details modal state
  const [viewingPatient, setViewingPatient] = useState<AdminPatient | null>(null);

  const { data: patients, isLoading, isError, error, refetch } = useAdminPatients();
  const { data: deleteImpact, isLoading: isLoadingImpact } = usePatientDeleteImpact(
    deletingPatient?.id ?? null,
    !!deletingPatient
  );
  const deletePatientMutation = useDeletePatient();
  const toggleStatusMutation = useTogglePatientStatus();

  const filteredPatients = useMemo(() => {
    if (!patients) return [];
    if (!search.trim()) return patients;
    const term = search.toLowerCase();
    return patients.filter((p) => p.name.toLowerCase().includes(term) || p.email.toLowerCase().includes(term));
  }, [patients, search]);

  const totalPages = Math.max(1, Math.ceil(filteredPatients.length / pageSize));
  const paginatedPatients = filteredPatients.slice((page - 1) * pageSize, page * pageSize);

  // Keep page within bounds if items are deleted
  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

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

  const handleDeleteConfirm = async () => {
    if (!deletingPatient) return;
    setDeleteError(null);
    try {
      await deletePatientMutation.mutateAsync(deletingPatient.id);
      toast(`Patient ${deletingPatient.name} permanently deleted`, 'success');
      setDeletingPatient(null);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to delete patient';
      setDeleteError(msg);
      toast(msg, 'error');
    }
  };

  const handleToggleStatusConfirm = async () => {
    if (!deactivatingPatient) return;
    try {
      await toggleStatusMutation.mutateAsync({ id: deactivatingPatient.id, status: 'inactive' });
      toast(`Patient ${deactivatingPatient.name} deactivated`, 'info');
      setDeactivatingPatient(null);
    } catch (err: any) {
      toast(err.response?.data?.message || err.message || 'Failed to deactivate patient', 'error');
    }
  };

  const handleActivate = async (patient: AdminPatient) => {
    try {
      await toggleStatusMutation.mutateAsync({ id: patient.id, status: 'active' });
      toast(`Patient ${patient.name} activated successfully`, 'success');
    } catch (err: any) {
      toast(err.response?.data?.message || err.message || 'Failed to activate patient', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Registered Patients"
        subtitle="Patients registered in Medi-Care with their contact information and appointment history counts"
        actions={
          <Button
            leftIcon={<UserPlus className="w-4 h-4" />}
            onClick={() => setIsAddPatientOpen(true)}
          >
            Add patient
          </Button>
        }
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
                <TableHead className="text-right pr-6">Actions</TableHead>
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
                    <StatusBadge status={p.status || 'active'} />
                  </TableCell>

                  <TableCell className="text-right pr-4">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* View details */}
                      <button
                        type="button"
                        title="View patient details"
                        aria-label="View patient details"
                        onClick={() => setViewingPatient(p)}
                        className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-sky-200 text-sky-600 bg-white hover:bg-sky-50 shadow-xs transition-colors cursor-pointer"
                      >
                        <Eye className="h-4 w-4" />
                      </button>

                      {/* Toggle status: activate / deactivate */}
                      {p.status === 'active' ? (
                        <button
                          type="button"
                          title="Deactivate patient"
                          aria-label="Deactivate patient"
                          onClick={() => setDeactivatingPatient(p)}
                          disabled={toggleStatusMutation.isPending}
                          className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-amber-200 text-amber-600 bg-white hover:bg-amber-50 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <PowerOff className="h-4 w-4" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          title="Activate patient"
                          aria-label="Activate patient"
                          onClick={() => handleActivate(p)}
                          disabled={toggleStatusMutation.isPending}
                          className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-emerald-200 text-emerald-600 bg-white hover:bg-emerald-50 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <Power className="h-4 w-4" />
                        </button>
                      )}

                      {/* Delete permanently */}
                      <button
                        type="button"
                        title="Delete permanently"
                        aria-label="Delete permanently"
                        onClick={() => {
                          setDeletingPatient(p);
                          setDeleteError(null);
                        }}
                        disabled={deletePatientMutation.isPending}
                        className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-rose-200 text-rose-600 bg-white hover:bg-rose-50 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
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

      {/* Delete Patient Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingPatient}
        onClose={() => {
          setDeletingPatient(null);
          setDeleteError(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete patient permanently?"
        variant="danger"
        requireText="DELETE"
        confirmLabel="Delete permanently"
        isLoading={deletePatientMutation.isPending}
        description={
          <div className="space-y-3">
            <p className="text-sm text-gray-700">
              Patient: <strong className="text-gray-900">{deletingPatient?.name}</strong> ({deletingPatient?.email})
            </p>

            {isLoadingImpact ? (
              <p className="text-xs text-gray-400 italic">Calculating dependent records...</p>
            ) : (
              <div className="rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-800 space-y-1">
                <p className="font-semibold text-rose-900">
                  This cannot be undone. This permanently removes the patient's account,{' '}
                  {deleteImpact?.totalAppointments ?? 0} appointments ({deleteImpact?.upcomingAppointments ?? 0} upcoming) and{' '}
                  {deleteImpact?.totalReviews ?? deleteImpact?.reviewsCount ?? 0} reviews.
                </p>
              </div>
            )}

            {deleteError && (
              <div className="p-3 bg-rose-100 border border-rose-300 rounded-lg text-xs text-rose-900 font-medium">
                {deleteError}
              </div>
            )}

            {deletingPatient?.status === 'active' && (
              <p className="text-xs text-gray-500 pt-1">
                Would you prefer to disable access instead?{' '}
                <button
                  type="button"
                  onClick={() => {
                    const target = deletingPatient;
                    setDeletingPatient(null);
                    setDeleteError(null);
                    if (target) setDeactivatingPatient(target);
                  }}
                  className="text-emerald-600 font-semibold hover:underline cursor-pointer"
                >
                  Deactivate instead
                </button>
              </p>
            )}
          </div>
        }
      />

      {/* Deactivate Patient Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deactivatingPatient}
        onClose={() => setDeactivatingPatient(null)}
        onConfirm={handleToggleStatusConfirm}
        title="Deactivate Patient Account"
        description={`Are you sure you want to deactivate ${deactivatingPatient?.name}? They will no longer be able to log in or book consultations until reactivated.`}
        confirmLabel="Deactivate"
        variant="warning"
        isLoading={toggleStatusMutation.isPending}
      />

      {/* View Patient Details Modal */}
      {viewingPatient && (
        <Modal
          isOpen={!!viewingPatient}
          onClose={() => setViewingPatient(null)}
          title="Patient Account Dossier"
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
              <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-lg shrink-0">
                {viewingPatient.name.charAt(0)}
              </div>
              <div>
                <h4 className="text-base font-bold text-gray-900">{viewingPatient.name}</h4>
                <p className="text-xs text-gray-500">Medi-Care Patient Record</p>
              </div>
              <div className="ml-auto">
                <StatusBadge status={viewingPatient.status || 'active'} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg border border-gray-100 bg-white space-y-1">
                <span className="text-gray-400 font-medium flex items-center gap-1">
                  <Hash className="w-3.5 h-3.5 text-gray-400" /> Patient ID
                </span>
                <p className="font-bold text-gray-800">#{viewingPatient.id}</p>
              </div>

              <div className="p-3 rounded-lg border border-gray-100 bg-white space-y-1">
                <span className="text-gray-400 font-medium flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-gray-400" /> Email Address
                </span>
                <p className="font-bold text-gray-800 truncate">{viewingPatient.email}</p>
              </div>

              <div className="p-3 rounded-lg border border-gray-100 bg-white space-y-1">
                <span className="text-gray-400 font-medium flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-gray-400" /> Phone Contact
                </span>
                <p className="font-bold text-gray-800">{viewingPatient.phone || 'None provided'}</p>
              </div>

              <div className="p-3 rounded-lg border border-gray-100 bg-white space-y-1">
                <span className="text-gray-400 font-medium flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" /> Member Since
                </span>
                <p className="font-bold text-gray-800">
                  {viewingPatient.createdAt ? viewingPatient.createdAt.split('T')[0] : 'N/A'}
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-gray-100">
              <Button variant="outline" size="sm" onClick={() => setViewingPatient(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Patient Create Modal */}
      <PatientCreateModal
        isOpen={isAddPatientOpen}
        onClose={() => setIsAddPatientOpen(false)}
        onSuccess={(patient) => {
          setIsAddPatientOpen(false);
          setCreatedCredentials({
            name: patient.name,
            email: patient.email,
            tempPassword: patient.tempPassword,
          });
        }}
      />

      {/* Reusable Credentials Modal */}
      {createdCredentials && (
        <CredentialsModal
          isOpen={!!createdCredentials}
          onClose={() => setCreatedCredentials(null)}
          name={createdCredentials.name}
          email={createdCredentials.email}
          role="patient"
          tempPassword={createdCredentials.tempPassword}
        />
      )}
    </div>
  );
};
