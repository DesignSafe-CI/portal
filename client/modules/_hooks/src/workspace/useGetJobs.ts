import { useQuery } from '@tanstack/react-query';
import apiClient from '../apiClient';
import { TJobsListingResponse } from './useJobsListing';

type TJobParamsType = {
  uuid?: string;
  query_string?: string;
  limit?: number;
  skip?: number;
};

async function getJobs(
  operation: string,
  { signal }: { signal: AbortSignal },
  params: TJobParamsType
) {
  const res = await apiClient.get<TJobsListingResponse>(
    `/api/workspace/jobs/${operation}`,
    {
      signal,
      ...params,
    }
  );
  return res.data.response;
}

function useGetJobs(operation: string, queryOptions: TJobParamsType) {
  return useQuery({
    queryKey: ['workspace', 'getJobs', operation, ...(<[]>queryOptions)],
    queryFn: ({ signal }) => getJobs(operation, { signal }, queryOptions),
  });
}

export default useGetJobs;
