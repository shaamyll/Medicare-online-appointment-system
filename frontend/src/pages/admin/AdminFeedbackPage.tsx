import React, { useState } from 'react';
import {
  MessageSquare,
  Trash2,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button, IconButton } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { FilterBar } from '@/components/ui/FilterBar';
import { Select } from '@/components/ui/Select';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell, TableHeadSerial, TableCellSerial, TablePagination } from '@/components/ui/Table';
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

  const doctorOptions = [
    { value: '', label: 'All Doctors' },
    ...doctorsList.map((doc) => ({
      value: String(doc.id),
      label: `Dr. ${doc.user?.name || (doc as any).name}`,
    })),
  ];

  const ratingOptions = [
    { value: '', label: 'All Ratings' },
    { value: '5', label: '5 Stars', dot: 'bg-emerald-500' },
    { value: '4', label: '4 Stars', dot: 'bg-teal-500' },
    { value: '3', label: '3 Stars', dot: 'bg-amber-500' },
    { value: '2', label: '2 Stars', dot: 'bg-orange-500' },
    { value: '1', label: '1 Star', dot: 'bg-rose-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Patient Feedback Moderation"
        subtitle="Review and moderate consultation ratings, clinical reviews, and patient experiences"
        badge={
          data ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
              <span>Total Reviews:</span>
              <span className="font-bold">{data.total}</span>
            </span>
          ) : undefined
        }
      />

      {/* Filters */}
      <FilterBar>
        <div className="w-full sm:w-64">
          <Select
            value={selectedDoctorId}
            onChange={(val) => {
              setSelectedDoctorId(val);
              setPage(1);
            }}
            options={doctorOptions}
            placeholder="Filter by Doctor"
            searchable
          />
        </div>

        <div className="w-full sm:w-44">
          <Select
            value={selectedRating}
            onChange={(val) => {
              setSelectedRating(val);
              setPage(1);
            }}
            options={ratingOptions}
            placeholder="Filter by Rating"
          />
        </div>

        {hasActiveFilters && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 ml-auto h-10"
          >
            Reset Filters
          </Button>
        )}
      </FilterBar>

      {/* Loading Skeleton */}
      {isLoading && (
        <Card className="rounded-xl border-gray-200">
          <CardContent className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <div className="w-28 h-4 bg-gray-200 rounded" />
                <div className="w-36 h-4 bg-gray-200 rounded" />
                <div className="w-24 h-4 bg-gray-200 rounded" />
                <div className="w-48 h-4 bg-gray-100 rounded" />
                <div className="w-20 h-4 bg-gray-100 rounded" />
                <div className="w-8 h-8 bg-gray-200 rounded-lg" />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {isError && (
        <Card className="p-8 text-center border-rose-200 space-y-3">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h3 className="text-base font-bold text-gray-900">Failed to load feedback records</h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            An error occurred while fetching feedback submissions.
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="text-xs">
            <RotateCcw className="w-3.5 h-3.5" />
            Retry
          </Button>
        </Card>
      )}

      {/* Success Content Table */}
      {!isLoading && !isError && (
        <Card className="rounded-xl border-gray-200 shadow-sm overflow-hidden">
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
                  <TableHead className="text-right pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length > 0 ? (
                  items.map((fb, idx) => {
                    const serialIndex = (page - 1) * limit + idx;
                    return (
                      <TableRow key={fb.id} className="hover:bg-gray-50 transition-colors">
                        <TableCellSerial index={serialIndex} />

                        <TableCell>
                          <p className="font-semibold text-gray-900 text-sm">
                            {fb.patientName || 'Anonymous Patient'}
                          </p>
                        </TableCell>

                        <TableCell>
                          <p className="font-medium text-gray-800 text-xs">
                            Dr. {fb.doctorName || 'Doctor'}
                          </p>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <StarRating value={fb.rating} readOnly size="sm" />
                            <span className="text-xs font-bold text-gray-700">({fb.rating})</span>
                          </div>
                        </TableCell>

                        <TableCell className="max-w-md">
                          <p className="text-xs text-gray-600 line-clamp-2">
                            {fb.comment || <span className="italic text-gray-400">No written comment</span>}
                          </p>
                        </TableCell>

                        <TableCell>
                          <span className="text-xs text-gray-500 whitespace-nowrap">
                            {new Date(fb.createdAt).toLocaleDateString()}
                          </span>
                        </TableCell>

                        <TableCell className="text-right pr-6">
                          <IconButton
                            icon={<Trash2 className="w-4 h-4" />}
                            variant="ghost"
                            size="sm"
                            title="Delete / Moderate Review"
                            aria-label="Delete / Moderate Review"
                            onClick={() => setDeletingFeedback(fb)}
                            className="text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-16 text-gray-400 text-xs">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                          <MessageSquare className="w-6 h-6" />
                        </div>
                        <p className="font-bold text-gray-700 text-sm">No feedback reviews found</p>
                        <p className="text-gray-400 text-xs max-w-sm">
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
              <TablePagination
                page={page}
                totalPages={totalPages}
                totalItems={data?.total || 0}
                limit={limit}
                itemLabel="reviews"
                onPageChange={(p) => setPage(p)}
              />
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
