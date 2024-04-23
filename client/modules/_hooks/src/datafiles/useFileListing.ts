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
  nextPageToken?: string;
};

async function getFileListing(
  api: string,
  system: string,
  path: string,
  scheme: string = 'private',
  limit: number = 100,
  page: number = 0,
  nextPageToken: string | undefined,
  { signal }: { signal: AbortSignal }
) {
  const offset = page * limit;

  const res = await apiClient.get<FileListingResponse>(
    `/api/datafiles/${api}/${scheme}/listing/${system}/${path}`,
    { signal, params: { offset, limit, nextPageToken } }
  );
  return res.data;
}

type TFileListingHookArgs = {
  api: string;
  system: string;
  path: string;
  scheme: string;
  pageSize: number;
  disabled?: boolean;
};

type TFileListingPageParam = {
  page: number;
  nextPageToken?: string;
};

function useFileListing({
  api,
  system,
  path,
  scheme = 'private',
  pageSize = 100,
  disabled = false,
}: TFileListingHookArgs) {
  return useInfiniteQuery<
    FileListingResponse,
    AxiosError<{ message?: string }>
  >({
    initialPageParam: 0,
    queryKey: ['datafiles', 'fileListing', api, system, path],
    queryFn: ({ pageParam, signal }) =>
      getFileListing(
        api,
        system || '-', // Backend throws errors if an empty string is passed.
        path,
        scheme,
        pageSize,
        (pageParam as TFileListingPageParam).page,
        (pageParam as TFileListingPageParam).nextPageToken,
        {
          signal,
        }
      ),
    enabled: !disabled,
    getNextPageParam: (lastPage, allpages): TFileListingPageParam | null => {
      return lastPage.listing.length >= pageSize
        ? { page: allpages.length, nextPageToken: lastPage.nextPageToken }
        : null;
    },
    retry: (failureCount, error) =>
      // only retry on 5XX errors
      (error.response?.status ?? 0) > 500 && failureCount < 3,
  });
}

export default useFileListing;
