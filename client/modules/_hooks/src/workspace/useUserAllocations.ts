import { useQuery } from '@tanstack/react-query';
import apiClient from '../apiClient';

export type TUserAllocation = {
  system: string;
  host: string;
  project_code: string;
  awarded: number;
  remaining: number;
  expiration: string;
};

const getUserAllocations = async ({ signal }: { signal: AbortSignal }) => {
  const res = await apiClient.get<{ allocations: TUserAllocation[] }>(
    '/api/users/allocations/',
    { signal }
  );
  return res.data.allocations;
};

const userAllocationsQuery = () => ({
  queryKey: ['dashboard', 'getUserAllocations'],
  queryFn: ({ signal }: { signal: AbortSignal }) =>
    getUserAllocations({ signal }),
  staleTime: 5000,
});

export const useGetUserAllocations = () => useQuery(userAllocationsQuery());
