import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../api/adminApi';

export const useAdminStats = () => {
  return useQuery({
    queryKey: ['adminStats'],
    queryFn: () => adminApi.getStats(),
  });
};

export const useAdminDoctors = (status?: string) => {
  return useQuery({
    queryKey: ['adminDoctors', status],
    queryFn: () => adminApi.getDoctors(status),
  });
};

export const useAdminDoctorRequests = () => {
  return useQuery({
    queryKey: ['adminDoctorRequests'],
    queryFn: () => adminApi.getDoctorRequests(),
  });
};

export const useApproveDoctor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => adminApi.approveDoctor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminDoctorRequests'] });
      queryClient.invalidateQueries({ queryKey: ['adminDoctors'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
    },
  });
};

export const useRejectDoctor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => adminApi.rejectDoctor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminDoctorRequests'] });
      queryClient.invalidateQueries({ queryKey: ['adminDoctors'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
    },
  });
};

export const useToggleDoctorStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => adminApi.toggleDoctorStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminDoctors'] });
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
    },
  });
};

export const useAdminPatients = () => {
  return useQuery({
    queryKey: ['adminPatients'],
    queryFn: () => adminApi.getPatients(),
  });
};

export const useAdminReports = () => {
  return useQuery({
    queryKey: ['adminReports'],
    queryFn: () => adminApi.getReports(),
  });
};

export const useCreateDepartment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; description?: string; icon?: string }) => adminApi.createDepartment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
    },
  });
};

export const useUpdateDepartment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => adminApi.updateDepartment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
  });
};

export const useDeleteDepartment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => adminApi.deleteDepartment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
    },
  });
};
