import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useReceipt } from '../hooks/usePayments';
import { Printer, CheckCircle2, ShieldCheck, HeartPulse, Building2, Calendar, Clock, User, Phone, Mail } from 'lucide-react';

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
      maxWidth="lg"
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
        <div className="space-y-6">
          {/* Printable Receipt Container */}
          <div
            id="printable-receipt"
            className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-2xs font-sans text-slate-800 print:border-none print:shadow-none print:p-0"
          >
            {/* Clinic Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-5 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <HeartPulse className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">
                    {receiptData.clinic.name}
                  </h2>
                  <p className="text-xs text-emerald-700 font-semibold">
                    {receiptData.clinic.tagline}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {receiptData.clinic.address} &bull; {receiptData.clinic.phone}
                  </p>
                </div>
              </div>

              <div className="text-left sm:text-right">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Official Receipt
                </span>
                <p className="text-xs font-mono font-bold text-slate-700 mt-1.5">
                  Ref: {receiptData.receipt.transactionRef}
                </p>
                <p className="text-[11px] text-slate-400">
                  Issued: {receiptData.receipt.paidAt ? new Date(receiptData.receipt.paidAt).toLocaleString() : 'N/A'}
                </p>
              </div>
            </div>

            {/* Patient & Doctor Two-Column Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-5 border-b border-slate-200 text-xs">
              {/* Patient Info */}
              <div className="bg-slate-50/60 p-4 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Billed To (Patient)
                </span>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  {receiptData.patient.name}
                </h4>
                <div className="mt-1.5 space-y-0.5 text-slate-600">
                  <p className="flex items-center gap-1.5">
                    <Mail className="w-3 h-3 text-slate-400" />
                    {receiptData.patient.email}
                  </p>
                  {receiptData.patient.phone && (
                    <p className="flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {receiptData.patient.phone}
                    </p>
                  )}
                </div>
              </div>

              {/* Doctor Info */}
              <div className="bg-slate-50/60 p-4 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Consulting Physician
                </span>
                <h4 className="text-sm font-bold text-slate-900">
                  Dr. {receiptData.doctor.name}
                </h4>
                <div className="mt-1.5 space-y-0.5 text-slate-600">
                  <p className="text-emerald-700 font-semibold">
                    {receiptData.doctor.specialization}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Building2 className="w-3 h-3 text-slate-400" />
                    Department of {receiptData.doctor.department}
                  </p>
                </div>
              </div>
            </div>

            {/* Appointment Schedule Details */}
            <div className="py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold text-slate-700">Date:</span>
                <span className="font-bold text-slate-900">{receiptData.appointment.appointmentDate}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold text-slate-700">Time Slot:</span>
                <span className="font-bold text-slate-900">
                  {receiptData.appointment.startTime} - {receiptData.appointment.endTime}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700">Appointment #:</span>
                <span className="font-mono font-bold text-slate-900">
                  {receiptData.appointment.appointmentNumber}
                </span>
              </div>
            </div>

            {/* Line Item Table */}
            <div className="py-5">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 text-left font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-2">Description</th>
                    <th className="py-2 text-center">Payment Method</th>
                    <th className="py-2 text-center">Status</th>
                    <th className="py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-3 font-semibold text-slate-900">
                      General Clinical Consultation & Assessment
                      <span className="block text-[11px] font-normal text-slate-500">
                        Physician evaluation, diagnosis review, and treatment prescription
                      </span>
                    </td>
                    <td className="py-3 text-center uppercase font-bold text-slate-700">
                      {receiptData.receipt.method}
                    </td>
                    <td className="py-3 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {receiptData.receipt.status}
                      </span>
                    </td>
                    <td className="py-3 text-right font-black text-slate-900 text-sm">
                      Rs. {receiptData.receipt.amount.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-900">
                    <td colSpan={3} className="py-3 font-bold text-slate-900 text-sm">
                      Total Paid
                    </td>
                    <td className="py-3 text-right font-black text-slate-900 text-base">
                      Rs. {receiptData.receipt.amount.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Footer Notice */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5 text-amber-700 bg-amber-50/60 px-2.5 py-1 rounded-md">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
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
            >
              <Printer className="w-4 h-4" />
              <span>Print Receipt</span>
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};
