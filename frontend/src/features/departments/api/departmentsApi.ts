import apiClient, { ApiResponse } from '@/lib/axios';
import { Department } from '../types/department.types';

export const departmentsApi = {
  getAll: async (all?: boolean): Promise<Department[]> => {
    const params = all ? { all: 'true' } : {};
    const response = await apiClient.get<ApiResponse<Department[]>>('/departments', { params });
    return response.data.data || [];
  },
};
