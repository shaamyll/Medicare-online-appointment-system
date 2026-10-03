import React, { useState } from 'react';
import { Check, X, Search, ShieldCheck, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell, TableHeadSerial, TableCellSerial } from '@/components/ui/Table';
import { LoadingState } from '@/components/ui/LoadingState';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useToast } from '@/components/ui/Toast';
import {
  useAdminDoctorRequests,
  useApproveDoctor,
  useRejectDoctor,
} from '@/features/admin/hooks/useAdmin';

export const AdminDoctorRequestsPage: React.FC = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [rejectingDoctor, setRejectingDoctor] = useState<{ id: number; name: string } | null>(null);

  const { data: requests, isLoading, isError, error, refetch } = useAdminDoctorRequests();
  const approveMutation = useApproveDoctor();
  const rejectMutation = useRejectDoctor();

  const handleApprove = async (id: number, name: string) => {
    try {
      await approveMutation.mutateAsync(id);
      toast(`Dr. ${name} approved successfully! They can now log in to the Doctor Portal.`, 'success');
    } catch (err: any) {
      toast(err.response?.data?.message || err.message || 'Failed to approve doctor', 'error');
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectingDoctor) return;
    try {
      await rejectMutation.mutateAsync(rejectingDoctor.id);
      toast(`Dr. ${rejectingDoctor.name}'s registration request was rejected.`, 'info');
      setRejectingDoctor(null);
    } catch (err: any) {
      toast(err.response?.data?.message || err.message || 'Failed to reject doctor', 'error');
    }
  };

  const filteredRequests = (requests || []).filter((doc) => {
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
    return <LoadingState message="Fetching pending doctor applications..." />;
  }

  if (isError) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-rose-200 shadow-sm space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900">Failed to load doctor requests</h3>
          <p className="text-sm text-slate-500 mt-1">
            {(error as any)?.message || 'An error occurred while fetching pending requests.'}
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Doctor Approval Requests
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
              {requests?.length || 0} Pending
            </span>
          </div>
          <p className="text-sm text-slate-500">
            Verify credentials, check medical license against official registers, and grant portal access
          </p>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by name, license..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500 w-56 transition"
          />
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
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
              {filteredRequests.length > 0 ? (
                filteredRequests.map((doc, idx) => {
                  const isApproving =
                    approveMutation.isPending && (approveMutation.variables as any) === doc.id;
                  const isRejecting =
                    rejectMutation.isPending && (rejectMutation.variables as any) === doc.id;

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
                            {doc.phone && (
                              <p className="text-[11px] text-slate-500">{doc.phone}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-900">
                          <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span className="font-mono font-bold text-xs">
                            {doc.licenseNumber || 'Not provided'}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <p className="font-medium text-slate-800 text-xs">{doc.specialization || 'General'}</p>
                        <p className="text-xs text-slate-500">{doc.departmentName || 'Unassigned'}</p>
                      </TableCell>

                      <TableCell>
                        <p className="text-xs text-slate-800 font-medium">
                          ${Number(doc.consultationFee || 0).toFixed(2)}
                        </p>
                        <p className="text-[11px] text-slate-500">{doc.experienceYears || 0} Yrs Practice</p>
                      </TableCell>

                      <TableCell>
                        <StatusBadge status="pending" />
                      </TableCell>

                      <TableCell className="text-right pr-6">
                        <div className="flex items-center justify-end gap-2">
                          {/* Approve Button */}
                          <button
                            type="button"
                            onClick={() => handleApprove(doc.id, doc.name)}
                            disabled={isApproving || isRejecting}
                            title="Approve Doctor"
                            aria-label="Approve Doctor"
                            className="w-9 h-9 rounded-lg border-2 border-emerald-300 bg-emerald-50/80 text-emerald-700 shadow-sm hover:shadow-md hover:bg-emerald-100 hover:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all flex items-center justify-center disabled:opacity-50 cursor-pointer"
                          >
                            {isApproving ? (
                              <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                          </button>

                          {/* Reject Button */}
                          <button
                            type="button"
                            onClick={() => setRejectingDoctor({ id: doc.id, name: doc.name })}
                            disabled={isApproving || isRejecting}
                            title="Reject Application"
                            aria-label="Reject Application"
                            className="w-9 h-9 rounded-lg border-2 border-rose-300 bg-rose-50/80 text-rose-600 shadow-sm hover:shadow-md hover:bg-rose-100 hover:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-400 transition-all flex items-center justify-center disabled:opacity-50 cursor-pointer"
                          >
                            {isRejecting ? (
                              <div className="w-4 h-4 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <X className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-slate-400 text-xs">
                    No pending doctor applications requiring verification.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Reject Confirmation Modal */}
      <ConfirmModal
        isOpen={!!rejectingDoctor}
        onClose={() => setRejectingDoctor(null)}
        title={`Reject Dr. ${rejectingDoctor?.name}?`}
        description={`Are you sure you want to reject the application for Dr. ${rejectingDoctor?.name}? Their pending status will be set to rejected.`}
        confirmLabel="Reject Application"
        variant="danger"
        isLoading={rejectMutation.isPending}
        onConfirm={handleRejectConfirm}
      />
    </div>
  );
};

