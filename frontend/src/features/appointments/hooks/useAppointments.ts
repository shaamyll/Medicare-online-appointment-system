import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentsApi } from '../api/appointmentsApi';
import { BookAppointmentData } from '../types/appointment.types';
import { queryKeys } from '@/lib/queryKeys';

export const useAppointments = (params?: { status?: string; date?: string }) => {
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

export const useBookAppointment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: BookAppointmentData) => appointmentsApi.book(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all });
      queryClient.invalidateQueries({ queryKey: ['appointments', 'slots'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.stats });
    },
  });
};

export const useCancelAppointment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => appointmentsApi.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all });
      queryClient.invalidateQueries({ queryKey: ['appointments', 'slots'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.stats });
    },
  });
};

export const useUpdateAppointmentStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      appointmentsApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all });
      queryClient.invalidateQueries({ queryKey: ['appointments', 'slots'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.stats });
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
