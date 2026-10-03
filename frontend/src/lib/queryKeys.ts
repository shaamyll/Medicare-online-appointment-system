/**
 * Central Query Key Factory for React Query
 * Single source of truth for all cache keys across the application
 */
export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  doctors: {
    all: ['doctors'] as const,
    list: (filters?: { departmentId?: number; search?: string }) =>
      ['doctors', 'list', filters ?? {}] as const,
    detail: (id: number | string) => ['doctors', 'detail', id] as const,
    mine: ['doctors', 'mine'] as const,
    mySchedule: ['doctors', 'mySchedule'] as const,
  },
  departments: {
    all: ['departments'] as const,
    list: (all?: boolean) => ['departments', 'list', { all: !!all }] as const,
    detail: (id: number | string) => ['departments', 'detail', id] as const,
  },
  appointments: {
    all: ['appointments'] as const,
    list: (filters?: { status?: string; role?: string; doctorId?: number; patientId?: number }) =>
      ['appointments', 'list', filters ?? {}] as const,
    detail: (id: number | string) => ['appointments', 'detail', id] as const,
    slots: (doctorId?: number | null, date?: string | null) =>
      ['appointments', 'slots', { doctorId: doctorId ?? null, date: date ?? null }] as const,
  },
  admin: {
    stats: ['admin', 'stats'] as const,
    doctors: (filters?: { status?: string }) =>
      ['admin', 'doctors', filters ?? {}] as const,
    doctorRequests: ['admin', 'doctorRequests'] as const,
    doctorDeleteImpact: (id: number | string) =>
      ['admin', 'doctorDeleteImpact', id] as const,
    patients: ['admin', 'patients'] as const,
    reports: ['admin', 'reports'] as const,
  },
  notifications: {
    all: ['notifications'] as const,
    list: (page: number = 1, filter: string = 'all') =>
      ['notifications', 'list', { page, filter }] as const,
    unreadCount: ['notifications', 'unreadCount'] as const,
  },
  payments: {
    all: ['payments'] as const,
    receipt: (appointmentId: number | string) => ['payments', 'receipt', appointmentId] as const,
  },
  feedback: {
    all: ['feedback'] as const,
    doctor: (doctorId: number | string, page: number = 1, limit: number = 10) =>
      ['feedback', 'doctor', doctorId, { page, limit }] as const,
    doctorOwn: (page: number = 1, limit: number = 10) =>
      ['feedback', 'doctorOwn', { page, limit }] as const,
    admin: (filters?: { doctorId?: number; rating?: number; page?: number; limit?: number }) =>
      ['feedback', 'admin', filters ?? {}] as const,
  },
};
