import { useInfiniteQuery } from '@tanstack/react-query';
import apiClient from '../apiClient';
import { AxiosError } from 'axios';

export type TFileListing = {
  system: string;
  name: string;
  path: string;
  format: 'folder' | 'raw';
  type: 'dir' | 'file';
  mimeType: string;
  lastModified: string;
  length: number;
  permissions: string;
};

export type FileListingResponse = {
  listing: TFileListing[];
  reachedEnd: boolean;
};

async function getFileListing(
  api: string,
  system: string,
  path: string,
  scheme: string = 'private',
  limit: number = 100,
  page: number = 0,
  { signal }: { signal: AbortSignal }
) {
  const offset = page * limit;

  const res = await apiClient.get<FileListingResponse>(
    `/api/datafiles/${api}/${scheme}/listing/${system}/${path}`,
    { signal, params: { offset, limit } }
  );
  return res.data;
}

type TFileListingHookArgs = {
  api: string;
  system: string;
  path: string;
  scheme: string;
  pageSize: number;
};

function useFileListing({
  api,
  system,
  path,
  scheme = 'private',
  pageSize = 100,
}: TFileListingHookArgs) {
  return useInfiniteQuery<
    FileListingResponse,
    AxiosError<{ message?: string }>
  >({
    initialPageParam: 0,
    queryKey: ['datafiles', 'fileListing', api, system, path],
    queryFn: ({ pageParam, signal }) =>
      getFileListing(api, system, path, scheme, pageSize, pageParam as number, {
        signal,
      }),
    getNextPageParam: (lastPage, allpages) => {
      return lastPage.listing.length >= pageSize ? allpages.length : null;
    },
    retry: (failureCount, error) =>
      // only retry on 5XX errors
      (error.response?.status ?? 0) > 500 && failureCount < 3,
  });
}

export default useFileListing;
