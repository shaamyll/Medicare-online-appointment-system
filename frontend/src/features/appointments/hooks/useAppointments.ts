import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentsApi } from '../api/appointmentsApi';
import { BookAppointmentData } from '../types/appointment.types';
import { queryKeys } from '@/lib/queryKeys';

export const useAppointments = (params?: { status?: string; date?: string; doctorId?: number }) => {
  return useQuery({
    queryKey: queryKeys.appointments.list(params),
    queryFn: () => appointmentsApi.getAll(params),
    refetchInterval: 30000, // 30s auto-refresh on appointment lists
  });
};

export const useDoctorSlots = (doctorId: number, date: string) => {
  return useQuery({
    queryKey: queryKeys.appointments.slots(doctorId, date),
    queryFn: () => appointmentsApi.getSlots(doctorId, date),
    enabled: !!doctorId && !!date,
  });
};

export const useAppointmentDetail = (id: number) => {
  return useQuery({
    queryKey: queryKeys.appointments.detail(id),
    queryFn: () => appointmentsApi.getById(id),
    enabled: !!id,
  });
};

export const useBookAppointment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: BookAppointmentData) => appointmentsApi.book(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all });
      queryClient.invalidateQueries({ queryKey: ['appointments', 'slots'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.stats });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
};

export const useCancelAppointment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (args: number | { id: number; reason?: string }) => {
      const id = typeof args === 'number' ? args : args.id;
      const reason = typeof args === 'number' ? undefined : args.reason;
      return appointmentsApi.cancel(id, reason);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.appointments });
      queryClient.invalidateQueries({ queryKey: ['appointments', 'slots'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.stats });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.reports });
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
};

export const useRescheduleAppointment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, date, startTime }: { id: number; date: string; startTime: string }) =>
      appointmentsApi.reschedule(id, { date, startTime }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.appointments });
      queryClient.invalidateQueries({ queryKey: ['appointments', 'slots'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.stats });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.reports });
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
};

export const useUpdateAppointmentStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, reason }: { id: number; status: string; reason?: string }) =>
      appointmentsApi.updateStatus(id, status, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.appointments });
      queryClient.invalidateQueries({ queryKey: ['appointments', 'slots'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.stats });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.reports });
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
};

export const useAddConsultation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: { diagnosis: string; prescription: string; consultationNotes: string };
    }) => appointmentsApi.addConsultation(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.stats });
    },
  });
};
