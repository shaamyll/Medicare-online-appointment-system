import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useReceipt } from '../hooks/usePayments';
import { Printer, CheckCircle2, ShieldCheck, HeartPulse, Calendar, Clock, Hash } from 'lucide-react';

export interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentId: number;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  appointmentId,
}) => {
  const { data: receiptData, isLoading, error } = useReceipt(appointmentId, isOpen);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Consultation Receipt & Bill"
      maxWidth="4xl"
    >
      {isLoading ? (
        <div className="py-12 text-center text-slate-400 text-xs">
          Generating itemized official receipt...
        </div>
      ) : error || !receiptData ? (
        <div className="py-8 text-center text-rose-600 text-xs">
          Unable to generate receipt. Please try again later.
        </div>
      ) : (
        <div className="space-y-4">
          {/* Printable Receipt Container */}
          <div
            id="printable-receipt"
            className="bg-white rounded-xl border border-slate-200 font-sans text-slate-800 print:border-none print:rounded-none"
          >
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
                  <HeartPulse className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-900 tracking-tight leading-tight">
                    {receiptData.clinic.name}
                  </h2>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {receiptData.clinic.tagline} &bull; {receiptData.clinic.address} &bull; {receiptData.clinic.phone}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 sm:text-right">
                <div>
                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                    Reference
                  </p>
                  <p className="text-xs font-mono font-semibold text-slate-800">
                    {receiptData.receipt.transactionRef}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {receiptData.receipt.paidAt ? new Date(receiptData.receipt.paidAt).toLocaleString() : 'N/A'}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700 uppercase tracking-wider whitespace-nowrap">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Official Receipt
                </span>
              </div>
            </div>

            {/* Body: details (left) + charges (right) */}
            <div className="grid grid-cols-1 md:grid-cols-12">
              {/* Details column */}
              <div className="md:col-span-5 px-6 py-5 space-y-5 border-b md:border-b-0 md:border-r border-slate-100 text-xs">
                <div>
                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">
                    Billed To
                  </p>
                  <p className="text-sm font-semibold text-slate-900">
                    {receiptData.patient.name}
                  </p>
                  <p className="text-slate-500 mt-0.5 break-all">{receiptData.patient.email}</p>
                  {receiptData.patient.phone && (
                    <p className="text-slate-500">{receiptData.patient.phone}</p>
                  )}
                </div>

                <div>
                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">
                    Consulting Physician
                  </p>
                  <p className="text-sm font-semibold text-slate-900">
                    Dr. {receiptData.doctor.name}
                  </p>
                  <p className="text-slate-500 mt-0.5">
                    {receiptData.doctor.specialization} &bull; {receiptData.doctor.department}
                  </p>
                </div>

                <div className="space-y-1.5 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Date
                    </span>
                    <span className="font-medium text-slate-900">
                      {receiptData.appointment.appointmentDate}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      Time Slot
                    </span>
                    <span className="font-medium text-slate-900">
                      {receiptData.appointment.startTime} - {receiptData.appointment.endTime}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <Hash className="w-3.5 h-3.5 text-slate-400" />
                      Appointment
                    </span>
                    <span className="font-mono font-medium text-slate-900">
                      {receiptData.appointment.appointmentNumber}
                    </span>
                  </div>
                </div>
              </div>

              {/* Charges column */}
              <div className="md:col-span-7 px-6 py-5 flex flex-col">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 text-left font-medium uppercase tracking-wider text-[10px]">
                      <th className="pb-2">Description</th>
                      <th className="pb-2 text-center">Method</th>
                      <th className="pb-2 text-center">Status</th>
                      <th className="pb-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="py-3 pr-3 font-medium text-slate-900">
                        General Clinical Consultation & Assessment
                        <span className="block text-[11px] font-normal text-slate-500 mt-0.5">
                          Physician evaluation, diagnosis review, and treatment prescription
                        </span>
                      </td>
                      <td className="py-3 text-center uppercase font-medium text-slate-600">
                        {receiptData.receipt.method}
                      </td>
                      <td className="py-3 text-center">
                        <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                          {receiptData.receipt.status}
                        </span>
                      </td>
                      <td className="py-3 text-right font-semibold text-slate-900">
                        Rs. {receiptData.receipt.amount.toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Total */}
                <div className="mt-auto pt-4">
                  <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
                    <span className="text-sm font-medium text-slate-600">Total Paid</span>
                    <span className="text-lg font-semibold text-slate-900 tracking-tight">
                      Rs. {receiptData.receipt.amount.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{receiptData.receipt.note}</span>
              </div>
              <span>Thank you for choosing Medi-Care.</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 print:hidden">
            <Button type="button" variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handlePrint}
              className="flex items-center gap-1.5"
              leftIcon={<Printer className="w-4 h-4" />}
            >
              <span>Print Receipt</span>
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};