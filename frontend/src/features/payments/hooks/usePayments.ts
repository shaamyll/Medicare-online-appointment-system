import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { paymentsApi } from '../api/paymentsApi';
import { PaymentMethod } from '../types/payment.types';
import { queryKeys } from '@/lib/queryKeys';

export const usePayAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ appointmentId, method }: { appointmentId: number; method: PaymentMethod }) =>
      paymentsApi.pay(appointmentId, method),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.payments.receipt(variables.appointmentId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.stats });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.reports });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
};

export const useReceipt = (appointmentId: number, enabled: boolean = true) => {
  return useQuery({
    queryKey: queryKeys.payments.receipt(appointmentId),
    queryFn: () => paymentsApi.getReceipt(appointmentId),
    enabled: enabled && !!appointmentId,
  });
};
