import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../api/adminApi';
import { queryKeys } from '@/lib/queryKeys';

export const useAdminStats = () => {
  return useQuery({
    queryKey: queryKeys.admin.stats,
    queryFn: () => adminApi.getStats(),
    refetchInterval: 30000, // 30s auto-refresh on admin dashboard
  });
};

export const useAdminDoctors = (status?: string) => {
  return useQuery({
    queryKey: queryKeys.admin.doctors({ status }),
    queryFn: () => adminApi.getDoctors(status),
  });
};

export const useAdminDoctorRequests = () => {
  return useQuery({
    queryKey: queryKeys.admin.doctorRequests,
    queryFn: () => adminApi.getDoctorRequests(),
    refetchInterval: 30000,
  });
};

export const useDoctorDeleteImpact = (id: number, enabled: boolean = true) => {
  return useQuery({
    queryKey: queryKeys.admin.doctorDeleteImpact(id),
    queryFn: () => adminApi.getDoctorDeleteImpact(id),
    enabled: !!id && enabled,
    staleTime: 0, // Always fresh when modal opens
  });
};

export const useAdminDoctorDetail = (id: number | null, enabled: boolean = true) => {
  return useQuery({
    queryKey: queryKeys.admin.doctorDetail(id ?? 0),
    queryFn: () => adminApi.getDoctorDetails(id!),
    enabled: !!id && enabled,
  });
};

export const useApproveDoctor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => adminApi.approveDoctor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'doctors'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.doctorRequests });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.stats });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.reports });
      queryClient.invalidateQueries({ queryKey: queryKeys.doctors.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.departments.all });
    },
  });
};

export const useRejectDoctor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => adminApi.rejectDoctor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'doctors'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.doctorRequests });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.stats });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.reports });
      queryClient.invalidateQueries({ queryKey: queryKeys.doctors.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.departments.all });
    },
  });
};

export const useToggleDoctorStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      adminApi.toggleDoctorStatus(id, status),
    // Optimistic update ONLY for simple activate/deactivate toggle with rollback on error
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ['admin', 'doctors'] });
      const previousQueries = queryClient.getQueriesData({ queryKey: ['admin', 'doctors'] });

      queryClient.setQueriesData({ queryKey: ['admin', 'doctors'] }, (old: any) => {
        if (!Array.isArray(old)) return old;
        return old.map((d: any) => (d.id === id ? { ...d, status } : d));
      });

      return { previousQueries };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'doctors'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.doctorRequests });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.stats });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.reports });
      queryClient.invalidateQueries({ queryKey: queryKeys.doctors.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.departments.all });
    },
  });
};

export const useDeleteDoctor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => adminApi.deleteDoctor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'doctors'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.doctorRequests });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.stats });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.reports });
      queryClient.invalidateQueries({ queryKey: queryKeys.doctors.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.departments.all });
    },
  });
};

export const useAdminPatients = () => {
  return useQuery({
    queryKey: queryKeys.admin.patients,
    queryFn: () => adminApi.getPatients(),
  });
};

export const useAdminReports = () => {
  return useQuery({
    queryKey: queryKeys.admin.reports,
    queryFn: () => adminApi.getReports(),
  });
};

export const useCreateDepartment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; description?: string; icon?: string }) =>
      adminApi.createDepartment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.departments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.doctors.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.stats });
    },
  });
};

export const useUpdateDepartment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      adminApi.updateDepartment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.departments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.doctors.all });
    },
  });
};

export const useDeleteDepartment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => adminApi.deleteDepartment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.departments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.doctors.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.stats });
    },
  });
};
