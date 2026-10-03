import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { doctorsApi } from '../api/doctorsApi';
import { Doctor, DoctorSchedule } from '../types/doctor.types';
import { queryKeys } from '@/lib/queryKeys';

export const useDoctors = (params?: { departmentId?: number; search?: string }) => {
  return useQuery({
    queryKey: queryKeys.doctors.list(params),
    queryFn: () => doctorsApi.getAll(params),
  });
};

export const useDoctor = (id: number) => {
  return useQuery({
    queryKey: queryKeys.doctors.detail(id),
    queryFn: () => doctorsApi.getById(id),
    enabled: !!id,
  });
};

export const useDoctorSchedule = () => {
  return useQuery({
    queryKey: queryKeys.doctors.mySchedule,
    queryFn: () => doctorsApi.getMySchedule(),
  });
};

export const useUpdateDoctorSchedule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (schedules: DoctorSchedule[]) => doctorsApi.updateMySchedule(schedules),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.doctors.mySchedule });
      queryClient.invalidateQueries({ queryKey: queryKeys.doctors.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all });
    },
  });
};

export const useDoctorProfile = () => {
  return useQuery({
    queryKey: queryKeys.doctors.mine,
    queryFn: () => doctorsApi.getMyProfile(),
  });
};

export const useUpdateDoctorProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Doctor> | FormData) => doctorsApi.updateMyProfile(data),
    onSuccess: (data: any) => {
      // 1. Immediately update auth.me cache
      if (data?.user) {
        queryClient.setQueryData(queryKeys.auth.me, {
          user: data.user,
          profile: data.profile ?? data,
        });
      } else {
        queryClient.setQueryData(queryKeys.auth.me, (old: any) => {
          if (!old) return old;
          return {
            ...old,
            user: {
              ...old.user,
              name: data?.user?.name || data?.name || old.user?.name,
              phone: data?.user?.phone || data?.phone || old.user?.phone,
              imagePath: data?.imagePath || data?.user?.imagePath || old.user?.imagePath,
              thumbnailPath: data?.thumbnailPath || data?.user?.thumbnailPath || old.user?.thumbnailPath,
              updatedAt: new Date().toISOString(),
            },
            profile: data,
          };
        });
      }

      // 2. Invalidate related keys
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
      queryClient.invalidateQueries({ queryKey: queryKeys.doctors.mine });
      queryClient.invalidateQueries({ queryKey: queryKeys.doctors.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.doctors() });
    },
  });
};
