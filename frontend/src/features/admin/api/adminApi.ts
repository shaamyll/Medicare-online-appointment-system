import apiClient, { ApiResponse } from '@/lib/axios';

export interface AdminStats {
  totalDoctors: number;
  pendingApprovals: number;
  totalPatients: number;
  todayAppointments: number;
  upcomingAppointments: number;
  totalDepartments: number;
  recentAppointments: any[];
}

export interface AdminDoctor {
  id: number;
  name: string;
  email: string;
  phone?: string;
  status: string;
  createdAt: string;
  specialization?: string;
  qualification?: string;
  experienceYears?: number;
  consultationFee?: number;
  roomNumber?: string;
  licenseNumber?: string;
  imagePath?: string | null;
  thumbnailPath?: string | null;
  departmentName?: string;
  departmentId?: number;
  updatedAt?: string;
}

export interface AdminPatient {
  id: number;
  name: string;
  email: string;
  phone?: string;
  status: string;
  createdAt: string;
  appointmentCount: number;
}

export interface AdminReports {
  appointmentsByStatus: { status: string; count: number }[];
  doctorsByDepartment: { name: string; count: number }[];
}

export const adminApi = {
  getStats: async (): Promise<AdminStats> => {
    const response = await apiClient.get<ApiResponse<AdminStats>>('/admin/stats');
    return response.data.data!;
  },

  getDoctors: async (status?: string): Promise<AdminDoctor[]> => {
    const response = await apiClient.get<ApiResponse<AdminDoctor[]>>('/admin/doctors', {
      params: status ? { status } : {}
    });
    return response.data.data || [];
  },

  getDoctorRequests: async (): Promise<AdminDoctor[]> => {
    const response = await apiClient.get<ApiResponse<AdminDoctor[]>>('/admin/doctor-requests');
    return response.data.data || [];
  },

  approveDoctor: async (id: number): Promise<void> => {
    await apiClient.post(`/admin/doctors/${id}/approve`);
  },

  rejectDoctor: async (id: number): Promise<void> => {
    await apiClient.post(`/admin/doctors/${id}/reject`);
  },

  toggleDoctorStatus: async (id: number, status: string): Promise<void> => {
    await apiClient.patch(`/admin/doctors/${id}/status`, { status });
  },

  getDoctorDeleteImpact: async (id: number): Promise<{
    doctorId: number;
    doctor: AdminDoctor;
    totalAppointments: number;
    upcomingAppointments: number;
  }> => {
    const response = await apiClient.get<
      ApiResponse<{
        doctorId: number;
        doctor: AdminDoctor;
        totalAppointments: number;
        upcomingAppointments: number;
      }>
    >(`/admin/doctors/${id}/delete-impact`);
    return response.data.data!;
  },

  deleteDoctor: async (id: number): Promise<void> => {
    await apiClient.delete(`/admin/doctors/${id}`);
  },

  getPatients: async (): Promise<AdminPatient[]> => {
    const response = await apiClient.get<ApiResponse<AdminPatient[]>>('/admin/patients');
    return response.data.data || [];
  },

  getReports: async (): Promise<AdminReports> => {
    const response = await apiClient.get<ApiResponse<AdminReports>>('/admin/reports');
    return response.data.data || { appointmentsByStatus: [], doctorsByDepartment: [] };
  },

  createDepartment: async (data: { name: string; description?: string; icon?: string }): Promise<any> => {
    const response = await apiClient.post<ApiResponse<any>>('/departments', data);
    return response.data.data;
  },

  updateDepartment: async (id: number, data: { name?: string; description?: string; icon?: string; isActive?: boolean }): Promise<any> => {
    const response = await apiClient.put<ApiResponse<any>>(`/departments/${id}`, data);
    return response.data.data;
  },

  deleteDepartment: async (id: number): Promise<void> => {
    await apiClient.delete(`/departments/${id}`);
  }
};
