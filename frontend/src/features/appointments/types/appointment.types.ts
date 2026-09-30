export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

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
  };
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  reasonForVisit?: string;
  createdAt: string;
}

export interface BookAppointmentData {
  doctorId: number;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  reasonForVisit?: string;
}
