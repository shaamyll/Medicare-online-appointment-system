import React, { useState } from 'react';
import { Search, PowerOff, Power, Trash2, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell, TableHeadSerial, TableCellSerial } from '@/components/ui/Table';
import { LoadingState } from '@/components/ui/LoadingState';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
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

  // Modals state
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
      toast(`Dr. ${deletingDoctor.name} has been permanently deleted.`, 'success');
      setDeletingDoctor(null);
    } catch (err: any) {
      toast(err.response?.data?.message || err.message || 'Failed to delete doctor', 'error');
      // Keep modal open on error as requested
    }
  };

  const filteredDoctors = (doctors || []).filter((doc) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      doc.name.toLowerCase().includes(term) ||
      doc.email.toLowerCase().includes(term) ||
      (doc.specialization && doc.specialization.toLowerCase().includes(term)) ||
      (doc.departmentName && doc.departmentName.toLowerCase().includes(term)) ||
      (doc.licenseNumber && doc.licenseNumber.toLowerCase().includes(term))
    );
  });

  if (isLoading) {
    return <LoadingState message="Loading doctors directory..." />;
  }

  if (isError) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-rose-200 shadow-sm space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900">Failed to load doctors</h3>
          <p className="text-sm text-slate-500 mt-1">
            {(error as any)?.message || 'An unexpected error occurred while fetching medical staff.'}
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
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Hospital Medical Staff</h1>
          <p className="text-sm text-slate-500">
            Overview of all registered doctors, specialties, departments, and practice statuses
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by name, spec, license..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500 w-56 transition"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs py-1.5 px-3 rounded-lg border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="pending">Pending</option>
            <option value="inactive">Inactive</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <Card>
        <CardContent className="p-0">
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
              {filteredDoctors.length > 0 ? (
                filteredDoctors.map((doc, idx) => {
                  const isMutatingStatus =
                    toggleStatusMutation.isPending &&
                    (toggleStatusMutation.variables as any)?.id === doc.id;
                  const isDeleting =
                    deleteMutation.isPending &&
                    (deleteMutation.variables as any) === doc.id;

                  return (
                    <TableRow key={doc.id}>
                      <TableCellSerial index={idx} />
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar
                            src={doc.thumbnailPath || doc.imagePath}
                            name={doc.name}
                            size="md"
                            version={doc.updatedAt}
                          />
                          <div>
                            <p className="font-semibold text-slate-900 text-sm">{doc.name}</p>
                            <p className="text-xs text-slate-400">{doc.email}</p>
                            {doc.licenseNumber && (
                              <p className="text-[11px] font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded inline-block mt-0.5 border border-blue-100">
                                Lic: {doc.licenseNumber}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <p className="font-medium text-slate-800 text-xs">{doc.specialization || 'General'}</p>
                        <p className="text-xs text-slate-500">{doc.departmentName || 'No department'}</p>
                      </TableCell>

                      <TableCell>
                        <p className="text-xs text-slate-800 font-medium">
                          ${Number(doc.consultationFee || 0).toFixed(2)}
                        </p>
                        <p className="text-[11px] text-slate-500">{doc.experienceYears || 0} Years Practice</p>
                      </TableCell>

                      <TableCell>
                        <StatusBadge status={doc.status} />
                      </TableCell>

                      <TableCell className="text-right pr-6">
                        <div className="flex items-center justify-end gap-2">
                          {doc.status === 'active' ? (
                            <button
                              type="button"
                              onClick={() => setDeactivatingDoctor({ id: doc.id, name: doc.name })}
                              disabled={isMutatingStatus}
                              title="Deactivate"
                              aria-label="Deactivate doctor"
                              className="w-9 h-9 rounded-lg border-2 border-amber-300 bg-amber-50/80 text-amber-700 shadow-sm hover:shadow-md hover:bg-amber-100 hover:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all flex items-center justify-center disabled:opacity-50 cursor-pointer"
                            >
                              {isMutatingStatus ? (
                                <div className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <PowerOff className="w-4 h-4" />
                              )}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleActivate(doc.id, doc.name)}
                              disabled={isMutatingStatus}
                              title="Activate"
                              aria-label="Activate doctor"
                              className="w-9 h-9 rounded-lg border-2 border-emerald-300 bg-emerald-50/80 text-emerald-700 shadow-sm hover:shadow-md hover:bg-emerald-100 hover:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all flex items-center justify-center disabled:opacity-50 cursor-pointer"
                            >
                              {isMutatingStatus ? (
                                <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Power className="w-4 h-4" />
                              )}
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              setDeletingDoctor({
                                id: doc.id,
                                name: doc.name,
                                email: doc.email,
                                photo: doc.thumbnailPath || doc.imagePath || undefined,
                              })
                            }
                            disabled={isDeleting}
                            title="Delete permanently"
                            aria-label="Delete doctor permanently"
                            className="w-9 h-9 rounded-lg border-2 border-rose-300 bg-rose-50/80 text-rose-600 shadow-sm hover:shadow-md hover:bg-rose-100 hover:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-400 transition-all flex items-center justify-center disabled:opacity-50 cursor-pointer"
                          >
                            {isDeleting ? (
                              <div className="w-4 h-4 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-slate-400 text-xs">
                    No doctor records match the filter criteria.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Deactivate Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deactivatingDoctor}
        onClose={() => setDeactivatingDoctor(null)}
        title={`Deactivate Dr. ${deactivatingDoctor?.name}?`}
        description={`Deactivate Dr. ${deactivatingDoctor?.name}? They will not be able to log in or receive bookings.`}
        confirmLabel="Deactivate"
        variant="warning"
        isLoading={toggleStatusMutation.isPending}
        onConfirm={handleDeactivateConfirm}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingDoctor}
        onClose={() => setDeletingDoctor(null)}
        title="Delete doctor permanently?"
        variant="danger"
        confirmLabel="Delete permanently"
        requireText="DELETE"
        isLoading={deleteMutation.isPending}
        onConfirm={handleDeleteConfirm}
      >
        <div className="space-y-4">
          {deletingDoctor && (
            <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <Avatar
                src={deletingDoctor.photo}
                name={deletingDoctor.name}
                size="md"
              />
              <div>
                <p className="font-semibold text-slate-900 text-sm">{deletingDoctor.name}</p>
                <p className="text-xs text-slate-500">{deletingDoctor.email}</p>
              </div>
            </div>
          )}

          <div className="text-sm text-slate-600">
            {isLoadingImpact ? (
              <div className="flex items-center gap-2 py-2 text-slate-500 text-xs">
                <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                Calculating appointment impact...
              </div>
            ) : (
              <p>
                This action cannot be undone. This will permanently remove the doctor's account, schedule, consultation notes and{' '}
                <span className="font-semibold text-rose-700">
                  {deleteImpact?.totalAppointments ?? 0} appointments ({deleteImpact?.upcomingAppointments ?? 0} upcoming)
                </span>
                .
              </p>
            )}
          </div>
        </div>
      </ConfirmModal>
    </div>
  );
};

