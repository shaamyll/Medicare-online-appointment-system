import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentsApi } from '../api/appointmentsApi';
import { BookAppointmentData } from '../types/appointment.types';

export const useAppointments = () => {
  return useQuery({
    queryKey: ['appointments'],
    queryFn: appointmentsApi.getAll,
  });
};

export const useBookAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BookAppointmentData) => appointmentsApi.book(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
};

export const useCancelAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => appointmentsApi.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
};
