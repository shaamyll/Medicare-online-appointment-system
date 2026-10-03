import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { AlertCircle, XCircle } from 'lucide-react';

export interface RejectReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => Promise<void>;
  appointmentNumber: string;
  patientName: string;
  isLoading?: boolean;
}

export const RejectReasonModal: React.FC<RejectReasonModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  appointmentNumber,
  patientName,
  isLoading = false,
}) => {
  const [reason, setReason] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (reason.length > 255) {
      setErrorMsg('Rejection reason cannot exceed 255 characters.');
      return;
    }

    try {
      await onConfirm(reason.trim() || undefined);
      setReason('');
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || err?.message || 'Failed to reject appointment.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Decline Appointment Request"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-100 flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-rose-900">
              Decline consultation for {patientName}
            </h4>
            <p className="text-xs text-rose-700 mt-0.5">
              Appointment #{appointmentNumber} will be marked as Rejected. If the patient has already paid, their payment will be refunded.
            </p>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-slate-700">
              Reason for Declining (Optional - shared with patient)
            </label>
            <span
              className={`text-[11px] font-semibold ${
                reason.length > 230 ? 'text-amber-600' : 'text-slate-400'
              }`}
            >
              {reason.length} / 255
            </span>
          </div>
          <textarea
            rows={3}
            maxLength={255}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Doctor called for emergency surgery, clinic closing early today, specialist referral required..."
            className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all placeholder:text-slate-400"
          />
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="danger"
            isLoading={isLoading}
            className="bg-rose-600 hover:bg-rose-700 text-white"
          >
            Decline Request
          </Button>
        </div>
      </form>
    </Modal>
  );
};
