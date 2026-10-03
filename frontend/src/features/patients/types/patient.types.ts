export interface PatientProfile {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  gender?: 'male' | 'female' | 'other' | null;
  dateOfBirth?: string | null;
  age?: number | null;
  role: 'patient';
  status: string;
  createdAt: string;
  updatedAt?: string | null;
}

export interface PatientProfileResponse {
  user: PatientProfile;
  profile: null;
}

export interface UpdatePatientProfileData {
  name: string;
  phone: string;
  gender?: 'male' | 'female' | 'other' | '';
  dateOfBirth?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword?: string;
}
