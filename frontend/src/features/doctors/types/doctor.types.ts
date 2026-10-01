import { User } from '@/features/auth/types/auth.types';

export interface DoctorSchedule {
  id?: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  isAvailable: boolean;
}

export interface Doctor {
  id: number;
  profileId?: number;
  user: User;
  department: {
    id: number;
    name: string;
  } | null;
  specialization: string;
  qualification?: string;
  experienceYears: number;
  consultationFee: number;
  bio?: string;
  roomNumber?: string;
  schedules?: DoctorSchedule[];
}
