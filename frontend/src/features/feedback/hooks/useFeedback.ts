import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { feedbackApi } from '../api/feedbackApi';
import { CreateFeedbackData } from '../types/feedback.types';
import { queryKeys } from '@/lib/queryKeys';

export const useCreateFeedback = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      appointmentId,
      data,
    }: {
      appointmentId: number;
      data: CreateFeedbackData;
    }) => feedbackApi.create(appointmentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.doctors.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.feedback.all });
    },
  });
};

export const useDoctorFeedback = (doctorId: number, page: number = 1, limit: number = 10) => {
  return useQuery({
    queryKey: queryKeys.feedback.doctor(doctorId, page, limit),
    queryFn: () => feedbackApi.getDoctorFeedback(doctorId, page, limit),
    enabled: !!doctorId,
  });
};

export const useDoctorOwnFeedback = (page: number = 1, limit: number = 10) => {
  return useQuery({
    queryKey: queryKeys.feedback.doctorOwn(page, limit),
    queryFn: () => feedbackApi.getDoctorOwnFeedback(page, limit),
  });
};

export const useAdminFeedback = (params?: {
  doctorId?: number;
  rating?: number;
  page?: number;
  limit?: number;
}) => {
  return useQuery({
    queryKey: queryKeys.feedback.admin(params),
    queryFn: () => feedbackApi.getAdminFeedback(params),
  });
};

export const useUpdateFeedback = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      appointmentId,
      data,
    }: {
      appointmentId: number;
      data: CreateFeedbackData;
    }) => feedbackApi.update(appointmentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.doctors.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.feedback.all });
    },
  });
};

export const useDeleteAppointmentFeedback = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (appointmentId: number) => feedbackApi.deleteForAppointment(appointmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.doctors.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.feedback.all });
    },
  });
};

export const useDeleteFeedback = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => feedbackApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.feedback.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.doctors.all });
    },
  });
};
