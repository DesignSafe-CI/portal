import { useInfiniteQuery } from '@tanstack/react-query';
import apiClient from '../apiClient';
import { AxiosError } from 'axios';

export type TJob = {
  appId: string;
  appVersion: string;
  archiveSystemId: string;
  condition: boolean;
  created: string;
  ended: string;
  execSystemId: string;
  lastUpdated: string;
  name: string;
  owner: string;
  remoteStarted: string;
  status: string;
  tenant: string;
  uuid: string;
};

type TJobsListing = {
  listing: TJob[];
  reachedEnd: boolean;
};

export type TJobsListingResponse = {
  response: TJobsListing | TJob;
  status: number;
};

async function getJobsListing(
  limit: number = 10,
  page: number = 0,
  { signal }: { signal: AbortSignal }
) {
  const skip = page * limit;
  const res = await apiClient.get<TJobsListingResponse>(
    `/api/workspace/jobs/listing`,
    {
      signal,
      params: { skip, limit },
    }
  );
  return res.data.response;
}

type TFileListingPageParam = {
  page: number;
  lastPageParam: number;
};

function useJobsListing(pageSize: number = 10) {
  return useInfiniteQuery<TJobsListing, AxiosError<{ message?: string }>>({
    initialPageParam: 0,
    queryKey: ['workspace', 'jobsListing'],
    queryFn: ({ pageParam, signal }) =>
      getJobsListing(pageSize, (pageParam as TFileListingPageParam).page, {
        signal,
      }),
    getNextPageParam: (
      lastPage,
      allpages,
      lastPageParam: number | unknown
    ): { page: number } | undefined => {
      return lastPage.listing && lastPage.listing.length >= pageSize
        ? { page: lastPageParam + 1 }
        : undefined;
    },
    retry: (failureCount, error) =>
      // only retry on 5XX errors
      (error.response?.status ?? 0) > 500 && failureCount < 3,
  });
}

export default useJobsListing;
