import { useQuery } from '@tanstack/react-query';
import { departmentsApi } from '../api/departmentsApi';
import { queryKeys } from '@/lib/queryKeys';

export const useDepartments = (all?: boolean) => {
  return useQuery({
    queryKey: queryKeys.departments.list(all),
    queryFn: () => departmentsApi.getAll(all),
  });
};
