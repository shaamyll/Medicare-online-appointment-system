import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { usePayAppointment } from '../hooks/usePayments';
import { PaymentMethod } from '../types/payment.types';
import {
  CreditCard,
  QrCode,
  Banknote,
  CheckCircle2,
  ShieldCheck,
  Loader2,
  AlertCircle,
  Receipt,
  Sparkles,
} from 'lucide-react';

export interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentId: number;
  appointmentNumber: string;
  amount: number;
  doctorName: string;
  specialization?: string;
  onSuccess?: () => void;
  onViewReceipt?: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  appointmentId,
  appointmentNumber,
  amount,
  doctorName,
  specialization,
  onSuccess,
  onViewReceipt,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('upi');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [transactionRef, setTransactionRef] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const payMutation = usePayAppointment();

  const handleClose = () => {
    if (isProcessing) return;
    setIsProcessing(false);
    setTransactionRef(null);
    setErrorMsg(null);
    onClose();
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsProcessing(true);

    try {
      // 1.5s simulated realistic banking transaction state
      await new Promise((res) => setTimeout(res, 1500));

      const res = await payMutation.mutateAsync({
        appointmentId,
        method: selectedMethod,
      });

      setTransactionRef(res.transactionRef);
      setIsProcessing(false);
      onSuccess?.();
    } catch (err: any) {
      setIsProcessing(false);
      const is422 = err?.response?.status === 422;
      const msg =
        err?.response?.data?.message || err?.message || 'Payment simulation failed. Please try again.';

      if (is422) {
        toast(msg, 'error');
        queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all });
        onClose();
        return;
      }

      setErrorMsg(msg);
    }
  };

  const methods = [
    {
      id: 'upi' as PaymentMethod,
      title: 'UPI Instant',
      description: 'Google Pay, PhonePe, Paytm, BHIM',
      icon: QrCode,
      color: 'text-indigo-600',
      badge: 'Popular',
    },
    {
      id: 'card' as PaymentMethod,
      title: 'Credit / Debit Card',
      description: 'Visa, MasterCard, RuPay (Demo)',
      icon: CreditCard,
      color: 'text-teal-600',
      badge: 'Instant',
    },
    {
      id: 'cash' as PaymentMethod,
      title: 'Pay at Clinic Desk',
      description: 'Cash payment upon arrival',
      icon: Banknote,
      color: 'text-emerald-600',
      badge: 'Counter',
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={transactionRef ? 'Payment Successful' : 'Demo Consultation Payment'}
      maxWidth="md"
    >
      {transactionRef ? (
        <div className="py-6 text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xs border border-emerald-100">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              <Sparkles className="w-3 h-3" /> Demo Payment Completed
            </span>
            <h3 className="text-xl font-bold text-slate-900 mt-2">Rs. {amount.toFixed(2)} Paid</h3>
            <p className="text-xs text-slate-500 mt-1">
              Transaction Reference: <span className="font-mono font-bold text-slate-800">{transactionRef}</span>
            </p>
          </div>

          <p className="text-xs text-slate-500 max-w-sm mx-auto bg-slate-50 p-3 rounded-xl border border-slate-100">
            Your appointment with Dr. {doctorName} is confirmed with a verified payment badge. You can view or print your itemized receipt at any time.
          </p>

          <div className="flex items-center justify-center gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="min-w-[100px]"
            >
              Close
            </Button>
            {onViewReceipt && (
              <Button
                type="button"
                variant="primary"
                onClick={() => {
                  handleClose();
                  onViewReceipt();
                }}
                className="flex items-center gap-1.5"
                leftIcon={<Receipt className="w-4 h-4" />}
              >
                <span>View Receipt</span>
              </Button>
            )}
          </div>
        </div>
      ) : (
        <form onSubmit={handlePay} className="space-y-4">
          {/* Demo Notice Banner */}
          <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 text-amber-800 text-xs flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Demo payment mode:</strong> No real money is charged. No card credentials required.
            </span>
          </div>

          {/* Amount & Doctor Summary */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Consultation Fee
              </span>
              <h4 className="text-sm font-bold text-slate-900">Dr. {doctorName}</h4>
              {specialization && (
                <p className="text-xs text-emerald-600 font-semibold">{specialization}</p>
              )}
              <span className="text-[11px] text-slate-500 font-mono mt-0.5 block">
                Appointment #{appointmentNumber}
              </span>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-slate-900 tracking-tight">
                Rs. {amount.toFixed(2)}
              </span>
              <span className="text-[10px] text-emerald-700 font-bold block uppercase tracking-wider">
                Total Due
              </span>
            </div>
          </div>

          {/* Method Selection Cards */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
              Select Payment Method
            </label>
            <div className="space-y-2">
              {methods.map((method) => {
                const Icon = method.icon;
                const isSelected = selectedMethod === method.id;

                return (
                  <label
                    key={method.id}
                    onClick={() => setSelectedMethod(method.id)}
                    className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/50 shadow-xs ring-1 ring-emerald-600'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 ' + method.color
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs sm:text-sm font-bold text-slate-900">
                            {method.title}
                          </span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600">
                            {method.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">{method.description}</p>
                      </div>
                    </div>

                    <input
                      type="radio"
                      name="payment_method"
                      value={method.id}
                      checked={isSelected}
                      onChange={() => setSelectedMethod(method.id)}
                      className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                    />
                  </label>
                );
              })}
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isProcessing}
              className="flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing Demo Payment...</span>
                </>
              ) : (
                <span>Pay Rs. {amount.toFixed(2)}</span>
              )}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
