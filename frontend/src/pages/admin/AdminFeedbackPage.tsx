import React, { useState } from 'react';
import {
  MessageSquare,
  Filter,
  Trash2,
  AlertCircle,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell, TableHeadSerial, TableCellSerial } from '@/components/ui/Table';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { StarRating } from '@/features/feedback/components/StarRating';
import { useToast } from '@/components/ui/Toast';
import { useAdminFeedback, useDeleteFeedback } from '@/features/feedback/hooks/useFeedback';
import { useDoctors } from '@/features/doctors/hooks/useDoctors';
import { Feedback } from '@/features/feedback/types/feedback.types';

export const AdminFeedbackPage: React.FC = () => {
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [selectedRating, setSelectedRating] = useState<string>('');
  const [deletingFeedback, setDeletingFeedback] = useState<Feedback | null>(null);
  const limit = 10;

  const { data: doctorsData } = useDoctors();
  const doctorsList = doctorsData || [];

  const { data, isLoading, isError, refetch } = useAdminFeedback({
    doctorId: selectedDoctorId ? Number(selectedDoctorId) : undefined,
    rating: selectedRating ? Number(selectedRating) : undefined,
    page,
    limit,
  });

  const deleteMutation = useDeleteFeedback();

  const handleDeleteConfirm = async () => {
    if (!deletingFeedback) return;
    try {
      await deleteMutation.mutateAsync(deletingFeedback.id);
      toast('Feedback removed successfully.', 'success');
      setDeletingFeedback(null);
    } catch (err: any) {
      toast(err?.response?.data?.message || err.message || 'Failed to remove feedback.', 'error');
    }
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.total / limit)) : 1;
  const items = data?.items || [];

  const resetFilters = () => {
    setSelectedDoctorId('');
    setSelectedRating('');
    setPage(1);
  };

  const hasActiveFilters = Boolean(selectedDoctorId || selectedRating);

  return (
    <div className="space-y-6">
      {/* Page Header & Filters */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-teal-50 text-teal-600 border border-teal-100 inline-flex">
                <MessageSquare className="w-5 h-5" />
              </span>
              <span>Patient Feedback Moderation</span>
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Review and moderate consultation ratings, clinical reviews, and patient experiences
            </p>
          </div>

          {data && (
            <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700">
              <span>Total Reviews:</span>
              <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 font-bold">
                {data.total}
              </span>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Filters:</span>
          </div>

          {/* Doctor Filter */}
          <select
            value={selectedDoctorId}
            onChange={(e) => {
              setSelectedDoctorId(e.target.value);
              setPage(1);
            }}
            className="text-xs py-1.5 px-3 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 max-w-[220px]"
          >
            <option value="">All Doctors</option>
            {doctorsList.map((doc) => (
              <option key={doc.id} value={doc.id}>
                Dr. {doc.user?.name || (doc as any).name}
              </option>
            ))}
          </select>

          {/* Rating Filter */}
          <select
            value={selectedRating}
            onChange={(e) => {
              setSelectedRating(e.target.value);
              setPage(1);
            }}
            className="text-xs py-1.5 px-3 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          >
            <option value="">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <Card className="rounded-2xl border-slate-200">
          <CardContent className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                <div className="w-28 h-4 bg-slate-200 rounded" />
                <div className="w-36 h-4 bg-slate-200 rounded" />
                <div className="w-24 h-4 bg-slate-200 rounded" />
                <div className="w-48 h-4 bg-slate-100 rounded" />
                <div className="w-20 h-4 bg-slate-100 rounded" />
                <div className="w-8 h-8 bg-slate-200 rounded-lg" />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {isError && (
        <div className="p-8 text-center bg-white rounded-2xl border border-rose-200 shadow-sm space-y-3">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">Failed to load feedback records</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            An error occurred while fetching feedback submissions.
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="text-xs">
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
            Retry
          </Button>
        </div>
      )}

      {/* Success Content Table */}
      {!isLoading && !isError && (
        <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHeadSerial />
                  <TableHead>Patient</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Comment</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length > 0 ? (
                  items.map((fb, idx) => {
                    const serialIndex = (page - 1) * limit + idx;
                    return (
                      <TableRow key={fb.id} className="hover:bg-slate-50/70 transition-colors">
                        <TableCellSerial index={serialIndex} />

                        <TableCell>
                          <p className="font-semibold text-slate-900 text-xs sm:text-sm">
                            {fb.patientName || 'Anonymous Patient'}
                          </p>
                        </TableCell>

                        <TableCell>
                          <p className="font-medium text-slate-800 text-xs">
                            Dr. {fb.doctorName || 'Doctor'}
                          </p>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <StarRating value={fb.rating} readOnly size="sm" />
                            <span className="text-xs font-bold text-slate-700">({fb.rating})</span>
                          </div>
                        </TableCell>

                        <TableCell className="max-w-md">
                          <p className="text-xs text-slate-600 line-clamp-2">
                            {fb.comment || <span className="italic text-slate-400">No written comment</span>}
                          </p>
                        </TableCell>

                        <TableCell>
                          <span className="text-xs text-slate-500 whitespace-nowrap">
                            {new Date(fb.createdAt).toLocaleDateString()}
                          </span>
                        </TableCell>

                        <TableCell className="text-right">
                          <button
                            type="button"
                            onClick={() => setDeletingFeedback(fb)}
                            title="Delete / Moderate Review"
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-16 text-slate-400 text-xs">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <MessageSquare className="w-8 h-8 text-slate-300" />
                        <p className="font-bold text-slate-700 text-sm">No feedback reviews found</p>
                        <p className="text-slate-400">
                          {hasActiveFilters
                            ? 'No patient reviews match the selected filter criteria.'
                            : 'No feedback records exist in the system yet.'}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                <span className="text-xs text-slate-500 font-medium">
                  Showing {(page - 1) * limit + 1} to{' '}
                  {Math.min(page * limit, data?.total || 0)} of {data?.total || 0} reviews
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="text-xs h-8"
                  >
                    <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                    Previous
                  </Button>
                  <span className="text-xs font-semibold text-slate-700 px-2">
                    {page} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="text-xs h-8"
                  >
                    Next
                    <ChevronRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Moderation Deletion Confirm Modal */}
      {deletingFeedback && (
        <ConfirmModal
          isOpen={!!deletingFeedback}
          onClose={() => setDeletingFeedback(null)}
          title="Delete Patient Review"
          description={`Are you sure you want to permanently remove this ${deletingFeedback.rating}-star review for Dr. ${deletingFeedback.doctorName}? This action will recompute the doctor's average rating.`}
          confirmLabel="Delete Review"
          variant="danger"
          isLoading={deleteMutation.isPending}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </div>
  );
};
