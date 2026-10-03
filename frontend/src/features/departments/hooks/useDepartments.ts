import { useQuery } from '@tanstack/react-query';
import { departmentsApi } from '../api/departmentsApi';
import { queryKeys } from '@/lib/queryKeys';

export const useDepartments = () => {
  return useQuery({
    queryKey: queryKeys.departments.list(),
    queryFn: departmentsApi.getAll,
  });
};
