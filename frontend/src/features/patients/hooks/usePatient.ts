import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { patientApi } from '../api/patientApi';
import { UpdatePatientProfileData, ChangePasswordData, PatientProfileResponse } from '../types/patient.types';
import { queryKeys } from '@/lib/queryKeys';

export const usePatientProfile = () => {
  return useQuery({
    queryKey: queryKeys.patient.profile,
    queryFn: () => patientApi.getProfile(),
  });
};

export const useUpdatePatientProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdatePatientProfileData) => patientApi.updateProfile(data),
    onSuccess: (data: PatientProfileResponse) => {
      // Immediately update auth.me cache so header and sidebar update without reload
      queryClient.setQueryData(queryKeys.auth.me, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          user: {
            ...old.user,
            ...data.user,
          },
        };
      });
      queryClient.setQueryData(queryKeys.patient.profile, data);
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
      queryClient.invalidateQueries({ queryKey: queryKeys.patient.profile });
    },
  });
};

export const useChangePatientPassword = () => {
  return useMutation({
    mutationFn: (data: ChangePasswordData) => patientApi.changePassword(data),
  });
};
