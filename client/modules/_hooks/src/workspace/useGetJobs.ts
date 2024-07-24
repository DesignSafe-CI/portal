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

const getJobQuery = (
  operation: TJobGetOperations,
  queryParams: TJobParamsType
) => ({
  queryKey: ['workspace', 'getJob', operation, queryParams],
  queryFn: () => getJobs(operation, queryParams),
  retry: false,
  enabled: !!queryParams.uuid,
});

export function useGetJobSuspense(
  operation: TJobGetOperations,
  queryParams: TJobParamsType
) {
  const shouldFetch = !!queryParams.uuid;

  // Always call, but use a empty query key and function if uuid is not available
  // useSuspenseQuery does not read `enabled` property of query.
  // Without this, react lint check will also fail.
  const result = useSuspenseQuery(
    shouldFetch
      ? getJobQuery(operation, queryParams)
      : { queryKey: ['null_operation'], queryFn: () => Promise.resolve(null) }
  );

  if (!shouldFetch) {
    return {
      data: null,
      error: null,
      isLoading: false,
      isFetched: false,
    };
  }

  return result;
}

export const useGetJobsSuspense = (
  operation: TJobGetOperations,
  queryParams: TJobParamsType
) => {
  return useSuspenseQuery(getJobsQuery(operation, queryParams));
};
