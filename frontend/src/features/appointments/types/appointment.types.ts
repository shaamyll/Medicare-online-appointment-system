export type AppointmentStatus = 'PENDING' | 'APPROVED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'REJECTED';

export type PaymentStatus = 'unpaid' | 'paid' | 'refunded';
export type PaymentMethod = 'upi' | 'card' | 'cash';

export interface PaymentInfo {
  id: number;
  amount: number;
  status: PaymentStatus;
  method?: PaymentMethod | null;
  transactionRef?: string | null;
  paidAt?: string | null;
}

export interface FeedbackInfo {
  id: number;
  rating: number;
  comment?: string | null;
  createdAt: string;
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
  };
  doctor: {
    id: number;
    name: string;
    specialization: string;
    department?: string;
    consultationFee?: number;
    phone?: string;
    email?: string;
  };
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  reasonForVisit?: string;
  rejectionReason?: string | null;
  rescheduleCount?: number;
  payment?: PaymentInfo | null;
  feedback?: FeedbackInfo | null;
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
