import { useQuery } from '@tanstack/react-query';
import { doctorsApi } from '../api/doctorsApi';

export const useDoctors = () => {
  return useQuery({
    queryKey: ['doctors'],
    queryFn: doctorsApi.getAll,
  });
};

export const useDoctor = (id: number) => {
  return useQuery({
    queryKey: ['doctors', id],
    queryFn: () => doctorsApi.getById(id),
    enabled: !!id,
  });
};
