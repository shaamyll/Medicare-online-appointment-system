import React, { useState } from 'react';
import { MessageSquare, AlertCircle, RotateCcw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { TablePagination } from '@/components/ui/Table';
import { RatingSummary } from '@/features/feedback/components/RatingSummary';
import { ReviewCard } from '@/features/feedback/components/ReviewCard';
import { useDoctorOwnFeedback } from '@/features/feedback/hooks/useFeedback';

export const DoctorReviewsPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading, isError, refetch } = useDoctorOwnFeedback(page, limit);

  const totalPages = data ? Math.ceil(data.total / limit) : 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Patient Reviews & Ratings"
        subtitle="Read verified feedback, clinical patient ratings, and consultation experiences"
        badge={
          data ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
              <span>Total Reviews:</span>
              <span className="font-bold">{data.ratingCount}</span>
            </span>
          ) : undefined
        }
      />

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-6">
          <div className="h-44 bg-white rounded-xl border border-gray-200 animate-pulse p-6" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 bg-white rounded-xl border border-gray-200 animate-pulse p-4" />
            ))}
          </div>
        </div>
      )}

      {/* Error State */}
      {isError && (
        <Card className="p-8 text-center border-rose-200 space-y-3">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h3 className="text-base font-bold text-gray-900">Failed to load patient reviews</h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            We encountered an issue fetching your ratings and feedback. Please try again.
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="text-xs">
            <RotateCcw className="w-3.5 h-3.5" />
            Retry
          </Button>
        </Card>
      )}

      {/* Success Content */}
      {!isLoading && !isError && data && (
        <div className="space-y-6">
          {/* Summary Banner */}
          <RatingSummary
            ratingAvg={data.ratingAvg}
            ratingCount={data.ratingCount}
            distribution={data.distribution}
          />

          {/* Reviews List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
                Recent Reviews ({data.total})
              </h2>
            </div>

            {data.items.length > 0 ? (
              <div className="space-y-3">
                {data.items.map((review) => (
                  <ReviewCard key={review.id} feedback={review} />
                ))}

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <Card className="p-0 overflow-hidden">
                    <TablePagination
                      page={page}
                      totalPages={totalPages}
                      totalItems={data.total}
                      limit={limit}
                      itemLabel="reviews"
                      onPageChange={(p) => setPage(p)}
                    />
                  </Card>
                )}
              </div>
            ) : (
              <Card className="rounded-xl border-gray-200 shadow-sm">
                <CardContent className="py-16 text-center">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center border border-amber-100">
                      <MessageSquare className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-800">No reviews yet</h3>
                    <p className="text-xs text-gray-400 max-w-sm">
                      When your patients complete consultations and submit their feedback, their ratings and reviews will appear here.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
