import { useQuery } from '@tanstack/react-query';
import apiClient from '../apiClient';
import { TTasAllocations } from './types';

export type TAllocParamsType = {
  username: string;
};

export type TGetAllocationsResponse = {
  response: TTasAllocations;
  status: number;
};

async function getAllocations(
  { signal }: { signal: AbortSignal },
  params: TAllocParamsType
) {
  const res = await apiClient.get<TGetAllocationsResponse>(
    `/api/workspace/allocations`,
    {
      signal,
      params,
    }
  );
  return res.data.response;
}

const getAllocationsQuery = (queryParams: TAllocParamsType) => ({
  queryKey: ['workspace', 'getAllocations', queryParams],
  queryFn: ({ signal }: { signal: AbortSignal }) =>
    getAllocations({ signal }, queryParams),
  staleTime: 5000,
});

const useGetAllocations = (queryParams: TAllocParamsType) => {
  return useQuery(getAllocationsQuery(queryParams));
};

export default useGetAllocations;
