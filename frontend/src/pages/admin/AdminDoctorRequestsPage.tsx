import React, { useState, useMemo } from 'react';
import { ShieldCheck, Check, X, AlertCircle, Eye } from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Avatar } from '@/components/ui/Avatar';
import { PageHeader } from '@/components/ui/PageHeader';
import { FilterBar } from '@/components/ui/FilterBar';
import { SearchInput } from '@/components/ui/SearchInput';
import { IconButton } from '@/components/ui/IconButton';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
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
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { DoctorDetailsModal } from './DoctorDetailsModal';
import { useToast } from '@/components/ui/Toast';
import {
  useAdminDoctorRequests,
  useApproveDoctor,
  useRejectDoctor,
} from '@/features/admin/hooks/useAdmin';

export const AdminDoctorRequestsPage: React.FC = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [detailsDoctorId, setDetailsDoctorId] = useState<number | null>(null);
  const [rejectingDoctor, setRejectingDoctor] = useState<{ id: number; name: string } | null>(null);

  const { data: requests, isLoading, isError, error, refetch } = useAdminDoctorRequests();
  const approveMutation = useApproveDoctor();
  const rejectMutation = useRejectDoctor();

  const handleApprove = async (id: number, name: string) => {
    try {
      await approveMutation.mutateAsync(id);
      toast(`Dr. ${name} has been approved and activated.`, 'success');
    } catch (err: any) {
      toast(err.response?.data?.message || err.message || 'Failed to approve doctor', 'error');
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectingDoctor) return;
    try {
      await rejectMutation.mutateAsync(rejectingDoctor.id);
      toast(`Application for Dr. ${rejectingDoctor.name} has been rejected.`, 'info');
      setRejectingDoctor(null);
    } catch (err: any) {
      toast(err.response?.data?.message || err.message || 'Failed to reject doctor', 'error');
    }
  };

  const filteredRequests = useMemo(() => {
    if (!requests) return [];
    if (!searchTerm.trim()) return requests;
    const term = searchTerm.toLowerCase();
    return requests.filter(
      (r) =>
        r.name.toLowerCase().includes(term) ||
        (r.specialization && r.specialization.toLowerCase().includes(term)) ||
        r.email.toLowerCase().includes(term) ||
        (r.departmentName && r.departmentName.toLowerCase().includes(term)) ||
        (r.licenseNumber && r.licenseNumber.toLowerCase().includes(term))
    );
  }, [requests, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / pageSize));
  const paginatedRequests = filteredRequests.slice((page - 1) * pageSize, page * pageSize);

  if (isLoading) {
    return <LoadingState message="Fetching pending doctor registrations..." />;
  }

  if (isError) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-rose-200 shadow-xs space-y-3">
        <AlertCircle className="h-10 w-10 text-rose-500 mx-auto" />
        <h3 className="text-base font-bold text-gray-900">Failed to load registration requests</h3>
        <p className="text-xs text-gray-500 max-w-md mx-auto">
          {(error as any)?.message || 'An error occurred while fetching pending requests.'}
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
        title="Doctor Approval Requests"
        subtitle="Verify credentials, check medical license against official registers, and grant portal access"
        badge={
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            {requests?.length || 0} Pending
          </span>
        }
      />

      {/* Filter Bar */}
      <FilterBar>
        <div className="w-full sm:max-w-md">
          <SearchInput
            value={searchTerm}
            onChange={(val) => {
              setSearchTerm(val);
              setPage(1);
            }}
            placeholder="Search by name, license, specialization..."
          />
        </div>
      </FilterBar>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        {filteredRequests.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title={searchTerm ? 'No Matching Requests' : 'No Pending Requests'}
              description={
                searchTerm
                  ? 'No doctor applications match your search query.'
                  : 'All physician registration applications have been reviewed. Good job!'
              }
            />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeadSerial />
                <TableHead>Doctor</TableHead>
                <TableHead>Medical License</TableHead>
                <TableHead>Specialization & Dept</TableHead>
                <TableHead>Experience & Fee</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedRequests.map((doc, idx) => {
                const isApproving =
                  approveMutation.isPending && (approveMutation.variables as any) === doc.id;
                const isRejecting =
                  rejectMutation.isPending && (rejectMutation.variables as any) === doc.id;

                return (
                  <TableRow key={doc.id}>
                    <TableCellSerial index={(page - 1) * pageSize + idx} />
                    <TableCell>
                      <div
                        className="flex items-center gap-3 cursor-pointer group"
                        onClick={() => setDetailsDoctorId(doc.id)}
                        title="Click to review doctor dossier"
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
                          <p className="text-xs text-gray-400">{doc.email}</p>
                          {doc.phone && <p className="text-[11px] text-gray-500">{doc.phone}</p>}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 border border-blue-200 text-blue-900">
                        <ShieldCheck className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                        <span className="font-mono font-bold text-xs">
                          {doc.licenseNumber || 'Not provided'}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <p className="font-semibold text-gray-800 text-xs">{doc.specialization || 'General'}</p>
                      <p className="text-xs text-gray-500">{doc.departmentName || 'Unassigned'}</p>
                    </TableCell>

                    <TableCell>
                      <p className="text-xs text-gray-800 font-semibold">
                        Rs. {Number(doc.consultationFee || 0).toFixed(0)}
                      </p>
                      <p className="text-[11px] text-gray-500">{doc.experienceYears || 0} Yrs Practice</p>
                    </TableCell>

                    <TableCell>
                      <StatusBadge status="pending" />
                    </TableCell>

                    <TableCell className="text-right pr-6">
                      <div className="flex items-center justify-end gap-2">
                        {/* Review Application Action Button */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDetailsDoctorId(doc.id)}
                          className="border-sky-200 text-sky-700 hover:bg-sky-50 text-xs shadow-2xs h-8"
                          leftIcon={<Eye className="h-3.5 w-3.5" />}
                        >
                          Review application
                        </Button>

                        {/* Approve Button */}
                        <IconButton
                          variant="success"
                          size="sm"
                          icon={<Check className="h-4 w-4" />}
                          title="Approve Doctor"
                          aria-label="Approve Doctor"
                          onClick={() => handleApprove(doc.id, doc.name)}
                          disabled={isApproving || isRejecting}
                          isLoading={isApproving}
                        />

                        {/* Reject Button */}
                        <IconButton
                          variant="danger"
                          size="sm"
                          icon={<X className="h-4 w-4" />}
                          title="Reject Application"
                          aria-label="Reject Application"
                          onClick={() => setRejectingDoctor({ id: doc.id, name: doc.name })}
                          disabled={isApproving || isRejecting}
                          isLoading={isRejecting}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}

        {totalPages > 1 && (
          <TablePagination
            page={page}
            totalPages={totalPages}
            totalItems={filteredRequests.length}
            pageSize={pageSize}
            onPageChange={(p) => setPage(p)}
          />
        )}
      </div>

      {/* Reject Confirmation Modal */}
      <ConfirmModal
        isOpen={!!rejectingDoctor}
        onClose={() => setRejectingDoctor(null)}
        onConfirm={handleRejectConfirm}
        title="Reject Doctor Application"
        description={`Are you sure you want to reject the application for Dr. ${rejectingDoctor?.name}? They will be notified by email.`}
        confirmLabel="Reject Application"
        variant="danger"
        isLoading={rejectMutation.isPending}
      />

      {/* Doctor Application Dossier Modal */}
      <DoctorDetailsModal
        doctorId={detailsDoctorId}
        isOpen={!!detailsDoctorId}
        onClose={() => setDetailsDoctorId(null)}
      />
    </div>
  );
};
