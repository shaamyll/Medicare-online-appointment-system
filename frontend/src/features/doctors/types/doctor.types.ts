import { User } from '@/features/auth/types/auth.types';

export interface Doctor {
  id: number;
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
}
