import React from 'react';
import { Check, X, Stethoscope, Mail, Phone } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import {
  useAdminDoctorRequests,
  useApproveDoctor,
  useRejectDoctor,
} from '@/features/admin/hooks/useAdmin';

export const AdminDoctorRequestsPage: React.FC = () => {
  const { toast } = useToast();
  const { data: requests, isLoading } = useAdminDoctorRequests();
  const approveMutation = useApproveDoctor();
  const rejectMutation = useRejectDoctor();

  const handleApprove = async (id: number, name: string) => {
    try {
      await approveMutation.mutateAsync(id);
      toast(`Dr. ${name} approved successfully! They can now log in to the Doctor Portal.`, 'success');
    } catch (err: any) {
      toast(err.message || 'Failed to approve doctor', 'error');
    }
  };

  const handleReject = async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to reject Dr. ${name}'s application?`)) {
      return;
    }
    try {
      await rejectMutation.mutateAsync(id);
      toast(`Dr. ${name}'s request was rejected.`, 'info');
    } catch (err: any) {
      toast(err.message || 'Failed to reject doctor', 'error');
    }
  };

  if (isLoading) {
    return <LoadingState message="Fetching pending doctor applications..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Doctor Approval Requests
            </h1>
            <Badge variant="warning">{requests?.length || 0} Pending</Badge>
          </div>
          <p className="text-sm text-slate-500">
            Review qualifications, verify credentials, and grant clinical portal access to new doctors
          </p>
        </div>
      </div>

      {!requests || requests.length === 0 ? (
        <Card className="p-8">
          <EmptyState
            title="No Pending Applications"
            description="All registered doctors have been evaluated. New doctor registrations will appear here for verification."
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {requests.map((doctor) => (
            <Card key={doctor.id} className="border-slate-200/90 shadow-sm flex flex-col justify-between">
              <div>
                <CardHeader className="flex flex-row items-start justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                      <Stethoscope className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold text-slate-900">{doctor.name}</CardTitle>
                      <p className="text-xs text-emerald-700 font-medium">{doctor.specialization}</p>
                    </div>
                  </div>
                  <Badge variant="warning">Pending Verification</Badge>
                </CardHeader>

                <CardContent className="pt-4 space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{doctor.email}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{doctor.phone || 'No phone'}</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Department:</span>
                      <span className="font-semibold text-slate-800">{doctor.departmentName || 'Unassigned'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Qualification:</span>
                      <span className="font-semibold text-slate-800">{doctor.qualification || 'MD'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Experience:</span>
                      <span className="font-semibold text-slate-800">{doctor.experienceYears} Years</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Consultation Fee:</span>
                      <span className="font-semibold text-emerald-700">${doctor.consultationFee?.toFixed(2)}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 italic">
                    Registered on: {new Date(doctor.createdAt).toLocaleDateString()}
                  </p>
                </CardContent>
              </div>

              <div className="p-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/50 rounded-b-xl">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleReject(doctor.id, doctor.name)}
                  isLoading={rejectMutation.isPending}
                  leftIcon={<X className="w-4 h-4 text-rose-600" />}
                  className="hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200"
                >
                  Reject
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleApprove(doctor.id, doctor.name)}
                  isLoading={approveMutation.isPending}
                  leftIcon={<Check className="w-4 h-4" />}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Approve Doctor
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
