import {
  useQuery,
  useSuspenseQuery,
  useQueryClient,
} from '@tanstack/react-query';
import apiClient from '../apiClient';
import { TTasAllocations } from './types';

export type TGetAllocationsResponse = {
  response: TTasAllocations;
  status: number;
};

async function getAllocations({ signal }: { signal: AbortSignal }) {
  const res = await apiClient.get<TGetAllocationsResponse>(
    `/api/workspace/allocations`,
    {
      signal,
    }
  );
  return res.data.response;
}
const getAllocationsQuery = () => ({
  queryKey: ['workspace', 'getAllocations'],
  queryFn: ({ signal }: { signal: AbortSignal }) => getAllocations({ signal }),
  staleTime: 5000,
});

export const useGetAllocations = () => {
  return useQuery(getAllocationsQuery());
};

export const useGetAllocationsSuspense = () => {
  return useSuspenseQuery(getAllocationsQuery());
};

export const usePrefetchGetAllocations = () => {
  const queryClient = useQueryClient();
  queryClient.ensureQueryData(getAllocationsQuery());
};
