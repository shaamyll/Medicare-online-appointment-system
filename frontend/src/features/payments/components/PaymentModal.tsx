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
  Building2,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  Receipt,
  Sparkles,
  Calendar,
  Clock,
} from 'lucide-react';

export interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentId: number;
  appointmentNumber: string;
  amount: number;
  doctorName: string;
  specialization?: string;
  appointmentDate?: string;
  startTime?: string;
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
  appointmentDate,
  startTime,
  onSuccess,
  onViewReceipt,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('upi');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [successState, setSuccessState] = useState<'online' | 'clinic' | null>(null);
  const [transactionRef, setTransactionRef] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const payMutation = usePayAppointment();

  const handleClose = () => {
    if (isProcessing) return;
    setIsProcessing(false);
    setSuccessState(null);
    setTransactionRef(null);
    setErrorMsg(null);
    onClose();
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsProcessing(true);

    const isClinic = selectedMethod === 'clinic' || selectedMethod === 'cash';

    try {
      if (!isClinic) {
        // Simulated realistic demo banking delay for online payments
        await new Promise((res) => setTimeout(res, 1200));
      }

      const res = await payMutation.mutateAsync({
        appointmentId,
        method: isClinic ? 'clinic' : selectedMethod,
      });

      if (isClinic) {
        setSuccessState('clinic');
      } else {
        setTransactionRef(res.transactionRef || null);
        setSuccessState('online');
      }

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
      id: 'clinic' as PaymentMethod,
      title: 'Pay at Clinic Desk',
      description: 'Cash or card payment upon arrival at clinic desk',
      icon: Building2,
      color: 'text-amber-600',
      badge: 'Counter',
    },
  ];

  const modalTitle =
    successState === 'online'
      ? 'Payment Successful'
      : successState === 'clinic'
      ? 'Pay at Clinic Selected'
      : 'Consultation Fee Payment';

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={modalTitle}
      maxWidth="md"
    >
      {/* 1. Online Success Screen */}
      {successState === 'online' && (
        <div className="py-6 text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xs border border-emerald-100">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              <Sparkles className="w-3 h-3" /> Demo Payment Completed
            </span>
            <h3 className="text-xl font-bold text-slate-900 mt-2">Rs. {amount.toFixed(2)} Paid</h3>
            {transactionRef && (
              <p className="text-xs text-slate-500 mt-1">
                Transaction Reference: <span className="font-mono font-bold text-slate-800">{transactionRef}</span>
              </p>
            )}
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
              Done
            </Button>
            {onViewReceipt && (
              <Button
                type="button"
                variant="primary"
                onClick={() => {
                  handleClose();
                  onViewReceipt();
                }}
                leftIcon={<Receipt className="w-4 h-4" />}
              >
                <span>View receipt</span>
              </Button>
            )}
          </div>
        </div>
      )}

      {/* 2. Pay at Clinic Confirmation Screen */}
      {successState === 'clinic' && (
        <div className="py-6 text-center space-y-4">
          <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto shadow-xs border border-amber-200">
            <Building2 className="w-8 h-8" />
          </div>

          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
              <Building2 className="w-3.5 h-3.5" /> Pay at clinic selected
            </span>
            <h3 className="text-lg font-bold text-slate-900 mt-2">
              Please pay Rs. {amount.toFixed(2)} at the clinic desk during your visit
            </h3>
          </div>

          {(appointmentDate || startTime) && (
            <div className="inline-flex flex-wrap items-center justify-center gap-3 px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-medium mx-auto">
              {appointmentDate && (
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <strong>{appointmentDate}</strong>
                </span>
              )}
              {startTime && (
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  <strong>{startTime}</strong>
                </span>
              )}
            </div>
          )}

          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-800 max-w-sm mx-auto">
            You will get a receipt after the clinic confirms your payment.
          </div>

          <div className="flex items-center justify-center pt-2">
            <Button
              type="button"
              variant="primary"
              onClick={handleClose}
              className="min-w-[120px]"
            >
              Done
            </Button>
          </div>
        </div>
      )}

      {/* 3. Payment Method Selection & Checkout Form */}
      {!successState && (
        <form onSubmit={handlePay} className="space-y-4">
          {/* Demo Notice Banner */}
          <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 text-amber-800 text-xs flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Payment Option:</strong> Select instant online payment or choose to pay at the clinic reception.
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
              isLoading={isProcessing}
              disabled={isProcessing}
            >
              {selectedMethod === 'clinic' || selectedMethod === 'cash'
                ? 'Confirm pay at clinic'
                : `Pay Rs. ${amount.toFixed(2)}`}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
