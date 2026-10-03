import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Clock,
  Mail,
  Award,
  Building,
  Copy,
  Check,
  AlertCircle,
  Star,
  CalendarClock,
  Trash2,
  PowerOff,
  Power,
  RotateCcw,
} from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { SegmentedTabs } from '@/components/ui/SegmentedTabs';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { StarRating } from '@/features/feedback/components/StarRating';
import { useToast } from '@/components/ui/Toast';
import {
  useAdminDoctorDetail,
  useApproveDoctor,
  useRejectDoctor,
  useToggleDoctorStatus,
  useDeleteDoctor,
} from '@/features/admin/hooks/useAdmin';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';

export interface DoctorDetailsModalProps {
  doctorId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DoctorDetailsModal: React.FC<DoctorDetailsModalProps> = ({
  doctorId,
  isOpen,
  onClose,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'overview' | 'schedule' | 'activity'>('overview');
  const [copiedLicense, setCopiedLicense] = useState(false);

  // Status Action Confirm Modal states
  const [confirmApprove, setConfirmApprove] = useState(false);
  const [confirmReject, setConfirmReject] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [confirmActivate, setConfirmActivate] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const {
    data: doctorData,
    isLoading,
    isError,
    refetch,
  } = useAdminDoctorDetail(doctorId, isOpen);

  const approveMutation = useApproveDoctor();
  const rejectMutation = useRejectDoctor();
  const toggleStatusMutation = useToggleDoctorStatus();
  const deleteMutation = useDeleteDoctor();

  // Reset tab when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab('overview');
      setCopiedLicense(false);
    }
  }, [isOpen, doctorId]);

  // Body scroll lock & ESC key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !doctorId) return null;

  const handleCopyLicense = (license: string) => {
    navigator.clipboard.writeText(license);
    setCopiedLicense(true);
    setTimeout(() => setCopiedLicense(false), 2000);
    toast('License number copied to clipboard', 'info');
  };

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'doctors'] });
    queryClient.invalidateQueries({ queryKey: queryKeys.admin.doctorRequests });
    queryClient.invalidateQueries({ queryKey: queryKeys.admin.stats });
    queryClient.invalidateQueries({ queryKey: queryKeys.doctors.all });
    if (doctorId) {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.doctorDetail(doctorId) });
    }
  };

  const handleApprove = async () => {
    try {
      await approveMutation.mutateAsync(doctorId);
      toast(`Dr. ${doctorData?.profile.name} has been approved and activated.`, 'success');
      invalidateAll();
      setConfirmApprove(false);
      onClose();
    } catch (err: any) {
      toast(err?.response?.data?.message || err?.message || 'Failed to approve doctor', 'error');
    }
  };

  const handleReject = async () => {
    try {
      await rejectMutation.mutateAsync(doctorId);
      toast(`Application for Dr. ${doctorData?.profile.name} has been rejected.`, 'info');
      invalidateAll();
      setConfirmReject(false);
      onClose();
    } catch (err: any) {
      toast(err?.response?.data?.message || err?.message || 'Failed to reject doctor', 'error');
    }
  };

  const handleToggleStatus = async (status: 'active' | 'inactive') => {
    try {
      await toggleStatusMutation.mutateAsync({ id: doctorId, status });
      toast(
        `Dr. ${doctorData?.profile.name} is now ${status}.`,
        status === 'active' ? 'success' : 'info'
      );
      invalidateAll();
      setConfirmDeactivate(false);
      setConfirmActivate(false);
      onClose();
    } catch (err: any) {
      toast(err?.response?.data?.message || err?.message || 'Failed to update doctor status', 'error');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(doctorId);
      toast(`Dr. ${doctorData?.profile.name} has been permanently deleted.`, 'success');
      invalidateAll();
      setConfirmDelete(false);
      onClose();
    } catch (err: any) {
      toast(err?.response?.data?.message || err?.message || 'Failed to delete doctor', 'error');
    }
  };

  const isMutating =
    approveMutation.isPending ||
    rejectMutation.isPending ||
    toggleStatusMutation.isPending ||
    deleteMutation.isPending;

  const profile = doctorData?.profile;
  const professional = doctorData?.professional;
  const stats = doctorData?.stats;
  const schedule = doctorData?.schedule || [];
  const recentReviews = doctorData?.recentReviews || [];
  const recentAppointments = doctorData?.recentAppointments || [];

  const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="doctor-details-title"
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Loading Skeleton */}
        {isLoading ? (
          <div className="p-8 space-y-6 animate-pulse">
            <div className="flex items-center gap-5">
              <div className="w-24 h-24 bg-gray-200 rounded-2xl" />
              <div className="space-y-3 flex-1">
                <div className="h-6 bg-gray-200 rounded w-1/3" />
                <div className="h-4 bg-gray-200 rounded w-1/4" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
            <div className="h-16 bg-gray-100 rounded-xl" />
            <div className="h-48 bg-gray-100 rounded-xl" />
          </div>
        ) : isError || !doctorData ? (
          <div className="p-10 text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-rose-500 mx-auto" />
            <h3 className="text-lg font-bold text-gray-900">Failed to load physician dossier</h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              We couldn't retrieve the details for this doctor. The record may have been removed or a network error occurred.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <Button variant="secondary" size="sm" onClick={onClose}>
                Close
              </Button>
              <Button variant="primary" size="sm" onClick={() => refetch()} leftIcon={<RotateCcw className="h-4 w-4" />}>
                Retry
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Header Strip with Soft Brand Gradient */}
            <div className="relative bg-gradient-to-r from-emerald-50 via-teal-50 to-white border-b border-gray-200 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
              <div className="flex items-center gap-5">
                <Avatar
                  src={profile?.thumbnailPath || profile?.imagePath}
                  name={profile?.name}
                  size="2xl"
                  shape="rounded"
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl ring-4 ring-white shadow-md shrink-0"
                />
                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2
                      id="doctor-details-title"
                      className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight"
                    >
                      Dr. {profile?.name}
                    </h2>
                    {profile?.status === 'active' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                        Verified Active
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                    <span className="text-emerald-700 bg-emerald-50/90 border border-emerald-200 px-2.5 py-0.5 rounded-md">
                      {professional?.specialization || 'Specialist'}
                    </span>
                    <span className="text-gray-600 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Building className="h-3 w-3 text-gray-400" />
                      {professional?.departmentName || 'General Clinic'}
                    </span>
                    <StatusBadge status={profile?.status || 'pending'} />
                  </div>

                  {stats && stats.ratingCount > 0 && (
                    <div className="flex items-center gap-1.5 pt-1 text-xs">
                      <StarRating value={stats.ratingAvg} readOnly size="sm" />
                      <span className="font-bold text-gray-900">{stats.ratingAvg.toFixed(1)}</span>
                      <span className="text-gray-400">({stats.ratingCount} reviews)</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none transition-colors"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Stat Tiles Row on bg-gray-50 */}
            {stats && (
              <div className="bg-gray-50 border-b border-gray-200 px-6 py-3 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-center">
                <div className="p-2 rounded-xl bg-white border border-gray-200 shadow-2xs">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Total Visits</p>
                  <p className="text-base font-black text-gray-900">{stats.totalAppointments}</p>
                </div>
                <div className="p-2 rounded-xl bg-white border border-gray-200 shadow-2xs">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Completed</p>
                  <p className="text-base font-black text-emerald-700">{stats.completedAppointments}</p>
                </div>
                <div className="p-2 rounded-xl bg-white border border-gray-200 shadow-2xs">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">Upcoming</p>
                  <p className="text-base font-black text-indigo-700">{stats.upcomingAppointments}</p>
                </div>
                <div className="p-2 rounded-xl bg-white border border-gray-200 shadow-2xs">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-rose-500">Cancelled</p>
                  <p className="text-base font-black text-rose-600">{stats.cancelledAppointments}</p>
                </div>
                <div className="p-2 rounded-xl bg-white border border-gray-200 shadow-2xs">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Patients</p>
                  <p className="text-base font-black text-gray-900">{stats.uniquePatients}</p>
                </div>
                <div className="p-2 rounded-xl bg-white border border-gray-200 shadow-2xs">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Revenue</p>
                  <p className="text-base font-black text-emerald-800">
                    Rs. {Number(stats.totalRevenue || 0).toFixed(0)}
                  </p>
                </div>
              </div>
            )}

            {/* Segmented Tabs Navigation */}
            <div className="px-6 pt-4 bg-white border-b border-gray-100">
              <SegmentedTabs
                tabs={[
                  { id: 'overview', label: 'Overview & Bio' },
                  { id: 'schedule', label: 'Weekly Timetable' },
                  {
                    id: 'activity',
                    label: 'Recent Activity',
                    count: recentAppointments.length + recentReviews.length,
                  },
                ]}
                activeTab={activeTab}
                onChange={(t) => setActiveTab(t as any)}
              />
            </div>

            {/* Scrollable Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 max-h-[50vh]">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Grid 1: Verification & Registration */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                          <ShieldCheck className="h-4 w-4 text-emerald-600" />
                          Medical License
                        </span>
                        {professional?.licenseNumber && (
                          <button
                            type="button"
                            onClick={() => handleCopyLicense(professional.licenseNumber)}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 px-2 py-0.5 rounded bg-white border border-gray-200 shadow-2xs"
                            title="Copy license number"
                          >
                            {copiedLicense ? (
                              <>
                                <Check className="h-3 w-3 text-emerald-600" />
                                Copied
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3" />
                                Copy
                              </>
                            )}
                          </button>
                        )}
                      </div>
                      <p className="text-base font-mono font-bold text-gray-900">
                        {professional?.licenseNumber || 'Not provided'}
                      </p>
                      <p className="text-[11px] text-gray-400">
                        Verify this registration on the Medical Practitioners Registry
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        Timestamps
                      </span>
                      <div className="text-xs space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Registered On:</span>
                          <span className="font-semibold text-gray-800">
                            {profile?.createdAt
                              ? new Date(profile.createdAt).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })
                              : 'Unknown'}
                          </span>
                        </div>
                        {profile?.approvedAt && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Status Updated:</span>
                            <span className="font-semibold text-gray-800">
                              {new Date(profile.approvedAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Grid 2: Contact & Professional Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Contact */}
                    <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-2xs space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5 border-b border-gray-100 pb-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        Contact Channels
                      </h4>
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Email:</span>
                          <span className="font-semibold text-gray-900">{profile?.email}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Phone:</span>
                          <span className="font-semibold text-gray-900">{profile?.phone || 'Not recorded'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Clinic Room:</span>
                          <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                            {professional?.roomNumber ? `Room ${professional.roomNumber}` : 'General Ward'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Professional Qualifications */}
                    <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-2xs space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5 border-b border-gray-100 pb-2">
                        <Award className="h-4 w-4 text-gray-400" />
                        Clinical Profile
                      </h4>
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Qualification:</span>
                          <span className="font-semibold text-gray-900">{professional?.qualification || 'MBBS'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Clinical Experience:</span>
                          <span className="font-semibold text-gray-900">{professional?.experienceYears || 0} Years</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Consultation Fee:</span>
                          <span className="font-bold text-emerald-700">
                            Rs. {Number(professional?.consultationFee || 0).toFixed(0)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bio */}
                  {professional?.bio && (
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                        Doctor Biography & Clinical Background
                      </h4>
                      <p className="text-xs sm:text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-xl p-4 leading-relaxed">
                        {professional.bio}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Weekly Timetable Tab */}
              {activeTab === 'schedule' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                    <p className="text-xs text-gray-500">Weekly clinical consultation hours & active slots</p>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Standard 30m slots
                    </span>
                  </div>

                  <div className="space-y-2">
                    {DAYS_OF_WEEK.map((day) => {
                      const daySchedule = schedule.find(
                        (s) => s.dayOfWeek.toLowerCase() === day.toLowerCase()
                      );
                      const isWorking = daySchedule && daySchedule.isAvailable;

                      return (
                        <div
                          key={day}
                          className={`p-3.5 rounded-xl border flex items-center justify-between transition-colors ${
                            isWorking
                              ? 'bg-white border-gray-200 shadow-2xs'
                              : 'bg-gray-50/80 border-gray-200/60 opacity-60'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-gray-900 w-24">{day}</span>
                            {isWorking ? (
                              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800">
                                <Clock className="h-3.5 w-3.5 text-emerald-600" />
                                <span>
                                  {daySchedule.startTime} &ndash; {daySchedule.endTime}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400 italic">No scheduled consultation hours</span>
                            )}
                          </div>

                          <div>
                            {isWorking ? (
                              <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full">
                                Available ({daySchedule.slotDurationMinutes}m)
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold bg-gray-100 text-gray-500 border border-gray-200 px-2 py-0.5 rounded-full">
                                Off / Unavailable
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Activity Tab: Recent Appointments & Reviews */}
              {activeTab === 'activity' && (
                <div className="space-y-6">
                  {/* Recent Appointments */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                      <CalendarClock className="h-4 w-4 text-indigo-600" />
                      Recent Consultations (Up to 5)
                    </h4>
                    {recentAppointments.length > 0 ? (
                      <div className="space-y-2">
                        {recentAppointments.map((apt) => (
                          <div
                            key={apt.id}
                            className="p-3 bg-white rounded-xl border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs text-xs"
                          >
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">
                                  #{apt.appointmentNumber}
                                </span>
                                <span className="font-bold text-gray-900">{apt.patientName}</span>
                              </div>
                              <p className="text-gray-500">
                                {apt.appointmentDate} at {apt.startTime}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 self-end sm:self-center">
                              <StatusBadge status={apt.status} />
                              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200">
                                {apt.paymentStatus}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic bg-gray-50 p-4 rounded-xl text-center border border-gray-200">
                        No appointment consultations recorded yet.
                      </p>
                    )}
                  </div>

                  {/* Recent Reviews */}
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                      <Star className="h-4 w-4 text-amber-500" />
                      Recent Patient Reviews (Up to 3)
                    </h4>
                    {recentReviews.length > 0 ? (
                      <div className="space-y-2">
                        {recentReviews.map((rev) => (
                          <div
                            key={rev.id}
                            className="p-3.5 bg-amber-50/40 rounded-xl border border-amber-200/70 space-y-1.5 text-xs"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <StarRating value={rev.rating} readOnly size="sm" />
                                <span className="font-bold text-gray-900">{rev.patientName}</span>
                                {rev.updatedAt && (
                                  <span className="text-[10px] bg-amber-200/80 text-amber-900 px-1.5 py-0.2 rounded font-medium">
                                    Edited
                                  </span>
                                )}
                              </div>
                              <span className="text-gray-400 text-[11px]">
                                {new Date(rev.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            {rev.comment && <p className="text-gray-700 italic">"{rev.comment}"</p>}
                            {rev.tags && rev.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 pt-1">
                                {rev.tags.map((t, idx) => (
                                  <span
                                    key={idx}
                                    className="text-[10px] font-medium bg-amber-100 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-full"
                                  >
                                    {t}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic bg-gray-50 p-4 rounded-xl text-center border border-gray-200">
                        No reviews submitted for this doctor yet.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Sticky Footer on bg-gray-50 with Status-Aware Actions */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <div className="text-xs text-gray-500 w-full sm:w-auto text-center sm:text-left">
                {profile?.status === 'pending' && (
                  <span className="text-amber-800 font-medium flex items-center gap-1.5 justify-center sm:justify-start">
                    <ShieldCheck className="h-4 w-4 text-amber-600 shrink-0" />
                    Verify the license number with the official medical council register before approving.
                  </span>
                )}
                {profile?.status === 'active' && (
                  <span>Physician active & visible on public booking portals.</span>
                )}
                {(profile?.status === 'inactive' || profile?.status === 'rejected') && (
                  <span>Physician deactivated & hidden from booking portals.</span>
                )}
              </div>

              {/* Status-Aware Action Buttons */}
              <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                {/* Pending Actions */}
                {profile?.status === 'pending' && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setConfirmReject(true)}
                      disabled={isMutating}
                      className="text-rose-600 border-rose-300 hover:bg-rose-50"
                    >
                      Reject Application
                    </Button>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => setConfirmApprove(true)}
                      disabled={isMutating}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      Approve & Activate
                    </Button>
                  </>
                )}

                {/* Active Actions */}
                {profile?.status === 'active' && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setConfirmDeactivate(true)}
                      disabled={isMutating}
                      className="text-amber-700 border-amber-300 hover:bg-amber-50"
                      leftIcon={<PowerOff className="h-3.5 w-3.5" />}
                    >
                      Deactivate
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setConfirmDelete(true)}
                      disabled={isMutating}
                      className="text-rose-600 border-rose-300 hover:bg-rose-50"
                      leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                    >
                      Delete Doctor
                    </Button>
                  </>
                )}

                {/* Inactive or Rejected Actions */}
                {(profile?.status === 'inactive' || profile?.status === 'rejected') && (
                  <>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => setConfirmActivate(true)}
                      disabled={isMutating}
                      className="bg-emerald-600 hover:bg-emerald-700"
                      leftIcon={<Power className="h-3.5 w-3.5" />}
                    >
                      Activate Doctor
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setConfirmDelete(true)}
                      disabled={isMutating}
                      className="text-rose-600 border-rose-300 hover:bg-rose-50"
                      leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                    >
                      Delete Doctor
                    </Button>
                  </>
                )}

                <Button size="sm" variant="secondary" onClick={onClose}>
                  Close
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Confirmation Modals */}
      <ConfirmModal
        isOpen={confirmApprove}
        onClose={() => setConfirmApprove(false)}
        onConfirm={handleApprove}
        title="Approve Physician Application"
        description={`Are you sure you want to approve Dr. ${doctorData?.profile.name}? They will be marked as active and listed on the booking directory.`}
        confirmLabel="Yes, Approve Physician"
        variant="primary"
        isLoading={approveMutation.isPending}
      />

      <ConfirmModal
        isOpen={confirmReject}
        onClose={() => setConfirmReject(false)}
        onConfirm={handleReject}
        title="Reject Physician Application"
        description={`Are you sure you want to reject Dr. ${doctorData?.profile.name}'s registration? They will be unable to practice on Medi-Care.`}
        confirmLabel="Reject Application"
        variant="danger"
        isLoading={rejectMutation.isPending}
      />

      <ConfirmModal
        isOpen={confirmDeactivate}
        onClose={() => setConfirmDeactivate(false)}
        onConfirm={() => handleToggleStatus('inactive')}
        title="Deactivate Doctor Account"
        description={`Are you sure you want to deactivate Dr. ${doctorData?.profile.name}? Patients will no longer be able to schedule consultations with them.`}
        confirmLabel="Deactivate"
        variant="danger"
        isLoading={toggleStatusMutation.isPending}
      />

      <ConfirmModal
        isOpen={confirmActivate}
        onClose={() => setConfirmActivate(false)}
        onConfirm={() => handleToggleStatus('active')}
        title="Activate Doctor Account"
        description={`Activate Dr. ${doctorData?.profile.name} to make their profile visible to patients and enable appointment booking.`}
        confirmLabel="Activate Doctor"
        variant="primary"
        isLoading={toggleStatusMutation.isPending}
      />

      <ConfirmModal
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title="Permanently Delete Doctor"
        description={`Are you sure you want to delete Dr. ${doctorData?.profile.name}? This will permanently remove their credentials, consultation schedule, and related records.`}
        confirmLabel="Yes, Delete Permanently"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};
