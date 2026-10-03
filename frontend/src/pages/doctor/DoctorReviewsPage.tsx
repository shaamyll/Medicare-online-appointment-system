import React, { useState } from 'react';
import { Star, MessageSquare, AlertCircle, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
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
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-amber-50 text-amber-500 border border-amber-100 inline-flex">
              <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
            </span>
            <span>Patient Reviews & Ratings</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Read verified feedback, clinical patient ratings, and consultation experiences
          </p>
        </div>

        {data && (
          <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700">
            <span>Total Reviews:</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
              {data.ratingCount}
            </span>
          </div>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-6">
          <div className="h-44 bg-white rounded-2xl border border-slate-200 animate-pulse p-6" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 bg-white rounded-2xl border border-slate-200 animate-pulse p-4" />
            ))}
          </div>
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="p-8 text-center bg-white rounded-2xl border border-rose-200 shadow-sm space-y-3">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">Failed to load patient reviews</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            We encountered an issue fetching your ratings and feedback. Please try again.
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="text-xs">
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
            Retry
          </Button>
        </div>
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
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Recent Reviews ({data.total})
              </h2>
              {totalPages > 1 && (
                <span className="text-xs text-slate-500 font-medium">
                  Page {page} of {totalPages}
                </span>
              )}
            </div>

            {data.items.length > 0 ? (
              <div className="space-y-3">
                {data.items.map((review) => (
                  <ReviewCard key={review.id} feedback={review} />
                ))}

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                      className="text-xs"
                    >
                      <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                      Previous
                    </Button>
                    <span className="text-xs font-semibold text-slate-600">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                      className="text-xs"
                    >
                      Next
                      <ChevronRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <Card className="rounded-2xl border-slate-200 shadow-sm">
                <CardContent className="py-16 text-center">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center border border-amber-100">
                      <MessageSquare className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-800">No reviews yet</h3>
                    <p className="text-xs text-slate-400 max-w-sm">
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
