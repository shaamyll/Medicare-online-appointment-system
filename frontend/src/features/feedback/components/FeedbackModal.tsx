import React, { useState, useEffect } from 'react';
import { CheckCircle2, MessageSquare, AlertCircle, Star, ShieldCheck, Tag } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useCreateFeedback, useUpdateFeedback } from '../hooks/useFeedback';
import { getImageUrl } from '@/lib/utils';

export interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentId: number;
  doctorName: string;
  specialization?: string;
  doctorPhoto?: string | null;
  visitDate?: string;
  initialReview?: {
    id?: number;
    rating: number;
    comment?: string | null;
    tags?: string[] | null;
  } | null;
  onSuccess?: () => void;
}

const AVAILABLE_TAGS = [
  'Good listener',
  'On time',
  'Clear explanation',
  'Friendly staff',
  'Long wait',
  'Rushed visit',
];

const RATING_LABELS: Record<number, string> = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Very good',
  5: 'Excellent',
};

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  appointmentId,
  doctorName,
  specialization,
  doctorPhoto,
  visitDate,
  initialReview,
  onSuccess,
}) => {
  const isEditing = Boolean(initialReview && initialReview.rating);

  const [rating, setRating] = useState<number>(initialReview?.rating || 0);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState<string>(initialReview?.comment || '');
  const [selectedTags, setSelectedTags] = useState<string[]>(initialReview?.tags || []);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [imageError, setImageError] = useState<boolean>(false);

  const createFeedbackMutation = useCreateFeedback();
  const updateFeedbackMutation = useUpdateFeedback();

  // Reset or initialize state on open
  useEffect(() => {
    if (isOpen) {
      setRating(initialReview?.rating || 0);
      setComment(initialReview?.comment || '');
      setSelectedTags(initialReview?.tags || []);
      setIsSubmitted(false);
      setErrorMsg(null);
    }
  }, [isOpen, initialReview]);

  const handleClose = () => {
    setIsSubmitted(false);
    setErrorMsg(null);
    onClose();
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const photoUrl = doctorPhoto && !imageError ? getImageUrl(doctorPhoto) : null;
  const initials = doctorName
    .replace(/^Dr\.\s*/i, '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('') || 'DR';

  const displayedRating = hoverRating !== null ? hoverRating : rating;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (rating < 1 || rating > 5) {
      setErrorMsg('Please select a rating between 1 and 5 stars.');
      return;
    }

    try {
      if (isEditing) {
        await updateFeedbackMutation.mutateAsync({
          appointmentId,
          data: {
            rating,
            comment: comment.trim() || undefined,
            tags: selectedTags,
          },
        });
      } else {
        await createFeedbackMutation.mutateAsync({
          appointmentId,
          data: {
            rating,
            comment: comment.trim() || undefined,
            tags: selectedTags,
          },
        });
      }
      setIsSubmitted(true);
      onSuccess?.();
    } catch (err: any) {
      setErrorMsg(
        err?.response?.data?.message || err?.message || 'Failed to submit review. Please try again.'
      );
    }
  };

  const isPending = createFeedbackMutation.isPending || updateFeedbackMutation.isPending;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isSubmitted ? 'Feedback Recorded' : isEditing ? 'Edit Your Visit Review' : 'Rate Your Visit'}
      maxWidth="md"
    >
      {isSubmitted ? (
        <div className="py-6 text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-2xs border border-emerald-100">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              {isEditing ? 'Review Updated Successfully!' : 'Thank you for your review!'}
            </h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto leading-relaxed">
              Your valuable feedback helps Dr. {doctorName} and other patients in the community.
            </p>
          </div>
          <div className="pt-2">
            <Button variant="primary" onClick={handleClose} className="min-w-[120px]">
              Done
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Doctor & Visit Summary Card */}
          <div className="p-3 rounded-2xl bg-gray-50 border border-gray-200/90 flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-13 rounded-xl bg-slate-200 overflow-hidden shrink-0 flex items-center justify-center font-bold text-slate-600 border border-gray-200">
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt={doctorName}
                    onError={() => setImageError(true)}
                    className="w-full h-full object-cover object-top"
                  />
                ) : (
                  <span className="text-sm font-extrabold">{initials}</span>
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-sm font-bold text-gray-900 truncate">Dr. {doctorName.replace(/^Dr\.\s*/i, '')}</h4>
                  <ShieldCheck className="w-3.5 h-3.5 text-sky-500 fill-sky-500 shrink-0" />
                </div>
                {specialization && (
                  <p className="text-[11px] font-semibold text-emerald-700 truncate">{specialization}</p>
                )}
              </div>
            </div>

            {visitDate && (
              <div className="text-right shrink-0 bg-white px-2.5 py-1 rounded-lg border border-gray-200">
                <span className="text-[10px] uppercase font-bold text-gray-400 block">Visit Date</span>
                <span className="text-xs font-bold text-gray-700">{visitDate}</span>
              </div>
            )}
          </div>

          {/* Star Rating Section */}
          <div className="p-4 rounded-2xl bg-gray-50/80 border border-gray-200 text-center space-y-2">
            <p className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">
              How was your consultation experience? *
            </p>

            <div
              className="flex justify-center items-center gap-1.5 py-1"
              onMouseLeave={() => setHoverRating(null)}
            >
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setRating(star);
                    }
                  }}
                  className="p-1 rounded-lg hover:scale-115 transition-transform cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-amber-400/50"
                  aria-label={`${star} Stars - ${RATING_LABELS[star]}`}
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      displayedRating >= star
                        ? 'text-amber-400 fill-amber-400 drop-shadow-2xs'
                        : 'text-gray-300 hover:text-gray-400'
                    }`}
                  />
                </button>
              ))}
            </div>

            <p className="text-xs font-bold text-amber-600 min-h-[18px]">
              {displayedRating > 0 ? RATING_LABELS[displayedRating] : 'Select rating'}
            </p>
          </div>

          {/* Quick Tag Chips */}
          <div>
            <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <Tag className="w-3.5 h-3.5 text-emerald-600" />
              <span>Quick Feedback Tags (Optional)</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {AVAILABLE_TAGS.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-1 ring-emerald-300 shadow-2xs'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Comments Textarea */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                <span>Comments & Experience (Optional)</span>
              </label>
              <span className={`text-[10px] ${comment.length > 470 ? 'text-amber-600 font-bold' : 'text-gray-400'}`}>
                {comment.length}/500
              </span>
            </div>
            <textarea
              rows={3}
              maxLength={500}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share details about the doctor's communication, diagnosis explanation, or care received..."
              className="w-full text-xs p-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-hidden focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none placeholder:text-gray-400"
            />
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isPending} size="sm">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isPending}
              disabled={rating < 1}
              size="sm"
              className="shadow-xs"
            >
              {isEditing ? 'Update Review' : 'Submit Review'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
