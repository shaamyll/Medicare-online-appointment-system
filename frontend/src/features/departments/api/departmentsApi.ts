import apiClient, { ApiResponse } from '@/lib/axios';
import { Department } from '../types/department.types';

export const departmentsApi = {
  getAll: async (): Promise<Department[]> => {
    const response = await apiClient.get<ApiResponse<Department[]>>('/departments');
    return response.data.data || [];
  },
};
