import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/Table';
import { LoadingState } from '@/components/ui/LoadingState';
import { useToast } from '@/components/ui/Toast';
import { useAdminDoctors, useToggleDoctorStatus } from '@/features/admin/hooks/useAdmin';

export const AdminDoctorsPage: React.FC = () => {
  const { toast } = useToast();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: doctors, isLoading } = useAdminDoctors(filterStatus === 'all' ? undefined : filterStatus);
  const toggleStatusMutation = useToggleDoctorStatus();

  const handleToggleStatus = async (id: number, currentStatus: string, name: string) => {
    const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const actionLabel = nextStatus === 'active' ? 'activate' : 'deactivate';

    if (!window.confirm(`Are you sure you want to ${actionLabel} Dr. ${name}?`)) {
      return;
    }

    try {
      await toggleStatusMutation.mutateAsync({ id, status: nextStatus });
      toast(`Dr. ${name} is now ${nextStatus}.`, 'success');
    } catch (err: any) {
      toast(err.message || 'Failed to update doctor status', 'error');
    }
  };

  const filteredDoctors = (doctors || []).filter((doc) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      doc.name.toLowerCase().includes(term) ||
      doc.email.toLowerCase().includes(term) ||
      (doc.specialization && doc.specialization.toLowerCase().includes(term)) ||
      (doc.departmentName && doc.departmentName.toLowerCase().includes(term))
    );
  });

  if (isLoading) {
    return <LoadingState message="Loading doctors directory..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Hospital Medical Staff</h1>
          <p className="text-sm text-slate-500">
            Overview of all registered doctors, specialties, departments, and practice statuses
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by name, spec..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500 w-56"
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

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Doctor Name</TableHead>
                <TableHead>Specialization & Department</TableHead>
                <TableHead>Qualifications & Exp</TableHead>
                <TableHead>Fee</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDoctors.length > 0 ? (
                filteredDoctors.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={doc.thumbnailPath || doc.imagePath}
                          name={doc.name}
                          size="md"
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
                      <p className="text-xs text-slate-800">{doc.qualification || 'MD'}</p>
                      <p className="text-[11px] text-slate-500">{doc.experienceYears} Years Practice</p>
                    </TableCell>

                    <TableCell className="font-semibold text-xs text-emerald-700">
                      ${doc.consultationFee?.toFixed(2)}
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant={
                          doc.status === 'active'
                            ? 'success'
                            : doc.status === 'pending'
                            ? 'warning'
                            : 'danger'
                        }
                      >
                        {doc.status}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right">
                      {doc.status === 'pending' ? (
                        <span className="text-xs text-amber-600 font-medium">Needs Verification</span>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleStatus(doc.id, doc.status, doc.name)}
                          className={doc.status === 'active' ? 'text-rose-600 hover:text-rose-700' : 'text-emerald-600 hover:text-emerald-700'}
                        >
                          {doc.status === 'active' ? 'Deactivate' : 'Activate'}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-400 text-xs">
                    No doctor records match the filter criteria.
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
