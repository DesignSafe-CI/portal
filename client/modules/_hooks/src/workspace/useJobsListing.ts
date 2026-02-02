import { useInfiniteQuery } from '@tanstack/react-query';
import apiClient from '../apiClient';
import { AxiosError } from 'axios';
import { TTapisJob } from './types';

export type TJobsListing = {
  listing: TTapisJob[];
  reachedEnd: boolean;
};

async function getJobsListing(
  limit: number = 10,
  page: number = 0,
  { signal }: { signal: AbortSignal }
) {
  const skip = page * limit;
  const res = await apiClient.get<{ response: TJobsListing; status: number }>(
    `/api/workspace/jobs/listing`,
    {
      signal,
      params: { skip, limit },
    }
  );
  return res.data.response;
}

function useJobsListing(pageSize: number = 10) {
  return useInfiniteQuery<TJobsListing, AxiosError<{ message?: string }>>({
    initialPageParam: 0,
    queryKey: ['workspace', 'jobsListing'],
    queryFn: ({ pageParam = 0, signal }) =>
      getJobsListing(pageSize, pageParam as number, { signal }),

    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      return lastPage.listing?.length >= pageSize
        ? (lastPageParam as number) + 1
        : undefined;
    },
    retry: (failureCount, error) =>
      // only retry on 5XX errors
      (error.response?.status ?? 0) > 500 && failureCount < 3,
  });
}

export default useJobsListing;
