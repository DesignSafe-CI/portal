import { useQuery } from '@tanstack/react-query';
import apiClient from '../apiClient';
import { TJob, TJobsListing } from './useJobsListing';

type TJobParamsType = {
  uuid?: string;
  query_string?: string;
  limit?: number;
  skip?: number;
};

type TJobGetOperations = 'select' | 'listing' | 'search';

async function getJobs(
  operation: TJobGetOperations,
  { signal }: { signal: AbortSignal },
  params: TJobParamsType
) {
  const res = await apiClient.get<{
    response: TJob | TJobsListing;
    status: number;
  }>(`/api/workspace/jobs/${operation}`, {
    signal,
    params,
  });
  return res.data.response;
}

function useGetJobs(operation: TJobGetOperations, queryParams: TJobParamsType) {
  return useQuery({
    queryKey: ['workspace', 'getJobs', operation, queryParams],
    queryFn: ({ signal }) => getJobs(operation, { signal }, queryParams),
  });
}

export default useGetJobs;
