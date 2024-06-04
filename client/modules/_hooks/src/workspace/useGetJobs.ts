import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import apiClient from '../apiClient';
import { TJobsListing } from './useJobsListing';
import { TTapisJob } from './types';

type TJobParamsType = {
  uuid?: string;
  query_string?: string;
  limit?: number;
  skip?: number;
};

type TJobGetOperations = 'select' | 'listing' | 'search';

async function getJobs(operation: TJobGetOperations, params: TJobParamsType) {
  const res = await apiClient.get<{
    response: TTapisJob | TJobsListing;
    status: number;
  }>(`/api/workspace/jobs/${operation}`, {
    params,
  });
  return res.data.response;
}

const getJobsQuery = (
  operation: TJobGetOperations,
  queryParams: TJobParamsType
) => ({
  queryKey: ['workspace', 'getJobs', operation, queryParams],
  queryFn: () => getJobs(operation, queryParams),
  retry: false,
});

export function useGetJobs(
  operation: TJobGetOperations,
  queryParams: TJobParamsType
) {
  return useQuery(getJobsQuery(operation, queryParams));
}

export const useGetJobsSuspense = (
  operation: TJobGetOperations,
  queryParams: TJobParamsType
) => {
  return useSuspenseQuery(getJobsQuery(operation, queryParams));
};
