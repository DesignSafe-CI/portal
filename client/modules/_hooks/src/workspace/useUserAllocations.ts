import { useQuery } from '@tanstack/react-query';
import apiClient from '../apiClient';

export type TSUAllocation = {
  system: string;
  host: string;
  project_code: string;
  awarded: number;
  remaining: number;
  expiration: string;
};

const getSUAllocations = async ({ signal }: { signal: AbortSignal }) => {
  const res = await apiClient.get<{ allocations: TSUAllocation[] }>(
    '/api/users/allocations/',
    { signal }
  );
  return res.data.allocations;
};

const suAllocationsQuery = () => ({
  queryKey: ['dashboard', 'getSUAllocations'],
  queryFn: ({ signal }: { signal: AbortSignal }) =>
    getSUAllocations({ signal }),
  staleTime: 5000,
});

export const useGetSUAllocations = () => useQuery(suAllocationsQuery());
