export type AppointmentStatus = 'PENDING' | 'APPROVED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'REJECTED';

export type PaymentStatus = 'unpaid' | 'paid' | 'refunded';
export type PaymentMethod = 'upi' | 'card' | 'cash' | 'clinic';
export type PaymentState = 'awaiting_approval' | 'payable' | 'pay_at_clinic' | 'paid' | 'refunded' | 'not_applicable';

export interface PaymentInfo {
  id: number;
  amount: number;
  status: PaymentStatus;
  method?: PaymentMethod | null;
  transactionRef?: string | null;
  paidAt?: string | null;
  state?: PaymentState;
  paymentState?: PaymentState;
  canPay?: boolean;
}

export interface FeedbackInfo {
  id: number;
  rating: number;
  comment?: string | null;
  tags?: string[] | null;
  createdAt: string;
  updatedAt?: string | null;
  editableUntil?: string | null;
  isEditable?: boolean;
}

export interface AppointmentReschedule {
  id: number;
  appointmentId: number;
  oldDate: string;
  oldStartTime: string;
  newDate: string;
  newStartTime: string;
  rescheduledBy: number;
  rescheduledByName?: string;
  rescheduledByRole?: string;
  createdAt: string;
}

export interface AppointmentSlot {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface SlotsResponse {
  date: string;
  dayOfWeek: string;
  hasSchedule: boolean;
  slots: AppointmentSlot[];
}

export interface ConsultationRecord {
  diagnosis?: string;
  prescription?: string;
  consultationNotes?: string;
}

export interface Appointment {
  id: number;
  appointmentNumber: string;
  patient: {
    id: number;
    name: string;
    email: string;
    phone?: string;
    gender?: string | null;
    dateOfBirth?: string | null;
    age?: number | null;
  };
  doctor: {
    id: number;
    name: string;
    specialization: string;
    department?: string;
    consultationFee?: number;
    phone?: string;
    email?: string;
    imagePath?: string | null;
    thumbnailPath?: string | null;
  };
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  reasonForVisit?: string;
  rejectionReason?: string | null;
  rescheduleCount?: number;
  payment?: PaymentInfo | null;
  canPay?: boolean;
  can_pay?: boolean;
  paymentState?: PaymentState;
  payment_state?: PaymentState;
  feedback?: FeedbackInfo | null;
  canReview?: boolean;
  can_review?: boolean;
  review?: {
    id?: number;
    rating: number;
    comment?: string | null;
    tags?: string[] | null;
    createdAt?: string;
    updatedAt?: string | null;
    editableUntil?: string | null;
    isEditable?: boolean;
  } | null;
  reschedules?: AppointmentReschedule[] | null;
  createdAt: string;
  consultation?: ConsultationRecord | null;
}

export interface BookAppointmentData {
  doctorId: number;
  appointmentDate: string;
  startTime: string;
  endTime?: string;
  reasonForVisit?: string;
}

export interface RescheduleAppointmentData {
  date: string;
  startTime: string;
}
