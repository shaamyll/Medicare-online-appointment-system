export type AppointmentStatus = 'PENDING' | 'APPROVED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'REJECTED';

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
