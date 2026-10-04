export type PaymentStatus = 'unpaid' | 'paid' | 'refunded';
export type PaymentMethod = 'upi' | 'card' | 'cash' | 'clinic';
export type PaymentState =
  | 'payable'
  | 'pay_at_clinic'
  | 'paid'
  | 'refunded'
  | 'awaiting_approval'
  | 'not_applicable';

export interface PayResponse {
  id: number;
  appointmentId: number;
  amount: number;
  status: PaymentStatus;
  method: PaymentMethod;
  paymentState?: PaymentState;
  transactionRef?: string | null;
  paidAt?: string | null;
  collectedBy?: number | null;
  message: string;
}

export interface ReceiptData {
  clinic: {
    name: string;
    tagline: string;
    address: string;
    phone: string;
    email: string;
    website: string;
  };
  receipt: {
    id: number;
    transactionRef: string;
    amount: number;
    status: string;
    method: string;
    paidAt: string | null;
    createdAt: string;
    isDemo: boolean;
    note: string;
  };
  appointment: {
    id: number;
    appointmentNumber: string;
    appointmentDate: string;
    startTime: string;
    endTime: string;
    status: string;
  };
  patient: {
    id: number;
    name: string;
    email: string;
    phone?: string;
  };
  doctor: {
    id: number;
    name: string;
    email?: string;
    specialization: string;
    department: string;
  };
}
