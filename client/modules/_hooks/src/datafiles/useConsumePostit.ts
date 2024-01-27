import { UseQueryOptions, useQuery } from '@tanstack/react-query';
import apiClient from '../apiClient';
import { AxiosError } from 'axios';

type TPostitParams = {
  href: string;
  responseType?: 'text' | 'blob';
  queryOptions: Omit<
    UseQueryOptions<string | Blob, AxiosError>,
    'queryKey' | 'queryFn'
  >;
};

async function fetchPostit({
  href,
  signal,
  responseType = 'text',
}: {
  href: string;
  signal: AbortSignal;
  responseType: 'text' | 'blob';
}) {
  const resp = await apiClient.get<string | Blob>(href, {
    signal,
    responseType,
  });
  return resp.data;
}

export function useConsumePostit({
  href,
  responseType = 'text',
  queryOptions,
}: TPostitParams) {
  return useQuery({
    queryKey: ['datafiles', 'preview', 'postit', href],
    queryFn: ({ signal }) => fetchPostit({ href, signal, responseType }),
    ...queryOptions,
  });
}
