import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { doctorsApi } from '../api/doctorsApi';
import { Doctor, DoctorSchedule } from '../types/doctor.types';

export const useDoctors = (params?: { departmentId?: number; search?: string }) => {
  return useQuery({
    queryKey: ['doctors', params],
    queryFn: () => doctorsApi.getAll(params),
  });
};

export const useDoctor = (id: number) => {
  return useQuery({
    queryKey: ['doctor', id],
    queryFn: () => doctorsApi.getById(id),
    enabled: !!id,
  });
};

export const useDoctorSchedule = () => {
  return useQuery({
    queryKey: ['myDoctorSchedule'],
    queryFn: () => doctorsApi.getMySchedule(),
  });
};

export const useUpdateDoctorSchedule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (schedules: DoctorSchedule[]) => doctorsApi.updateMySchedule(schedules),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myDoctorSchedule'] });
    },
  });
};

export const useDoctorProfile = () => {
  return useQuery({
    queryKey: ['myDoctorProfile'],
    queryFn: () => doctorsApi.getMyProfile(),
  });
};

export const useUpdateDoctorProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Doctor> | FormData) => doctorsApi.updateMyProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myDoctorProfile'] });
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
    },
  });
};
