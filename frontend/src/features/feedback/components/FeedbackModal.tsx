import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { StarRating } from './StarRating';
import { useCreateFeedback } from '../hooks/useFeedback';
import { CheckCircle2, MessageSquare, AlertCircle } from 'lucide-react';

export interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentId: number;
  doctorName: string;
  specialization?: string;
  onSuccess?: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  appointmentId,
  doctorName,
  specialization,
  onSuccess,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const createFeedbackMutation = useCreateFeedback();

  const handleClose = () => {
    setIsSubmitted(false);
    setErrorMsg(null);
    setComment('');
    setRating(5);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (rating < 1 || rating > 5) {
      setErrorMsg('Please select a star rating from 1 to 5.');
      return;
    }

    try {
      await createFeedbackMutation.mutateAsync({
        appointmentId,
        data: {
          rating,
          comment: comment.trim() || undefined,
        },
      });
      setIsSubmitted(true);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setErrorMsg(
        err?.response?.data?.message || err?.message || 'Failed to submit feedback. Please try again.'
      );
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isSubmitted ? 'Feedback Received' : 'Rate Your Consultation'}
      maxWidth="md"
    >
      {isSubmitted ? (
        <div className="py-6 text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xs border border-emerald-100">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Thank you for your review!</h3>
            <p className="text-sm text-slate-600 mt-1 max-w-sm mx-auto">
              Your feedback helps Dr. {doctorName} and other patients in our healthcare community.
            </p>
          </div>
          <div className="pt-2">
            <Button variant="primary" onClick={handleClose} className="min-w-[120px]">
              Done
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
            <p className="text-xs uppercase tracking-wider font-bold text-slate-500">
              Doctor Consultation
            </p>
            <h4 className="text-base font-bold text-slate-900 mt-0.5">Dr. {doctorName}</h4>
            {specialization && (
              <p className="text-xs text-emerald-600 font-semibold">{specialization}</p>
            )}

            <div className="mt-4 flex flex-col items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-700">
                How was your experience?
              </span>
              <StarRating value={rating} onChange={setRating} size="lg" />
              <span className="text-xs font-bold text-amber-600 mt-0.5">
                {rating === 5 && 'Excellent - Highly Recommended'}
                {rating === 4 && 'Good - Satisfied'}
                {rating === 3 && 'Average'}
                {rating === 2 && 'Poor'}
                {rating === 1 && 'Very Dissatisfied'}
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                Comments & Thoughts (Optional)
              </label>
              <span
                className={`text-[11px] font-semibold ${
                  comment.length > 450 ? 'text-amber-600' : 'text-slate-400'
                }`}
              >
                {comment.length} / 500
              </span>
            </div>
            <textarea
              rows={4}
              maxLength={500}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share details about your appointment, the doctor's communication, wait time, or diagnosis explanation..."
              className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400"
            />
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={createFeedbackMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={createFeedbackMutation.isPending}
            >
              Submit Review
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
