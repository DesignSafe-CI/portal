import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import apiClient from '../../apiClient';
import { TBaseProject } from './types';

export type TProjectListingResponse = {
  total: number;
  result: TBaseProject[];
};

async function getProjectListing({
  page = 1,
  limit = 100,
  queryString,
  signal,
}: {
  page: number;
  limit: number;
  queryString?: string;
  signal: AbortSignal;
}) {
  const resp = await apiClient.get<TProjectListingResponse>(
    '/api/projects/v2',
    {
      signal,
      params: { offset: (page - 1) * limit, limit, q: queryString },
    }
  );
  return resp.data;
}

export function useProjectListing(page: number, limit: number) {
  const [searchParams] = useSearchParams();
  const queryString = searchParams.get('q') ?? undefined;
  return useQuery({
    queryKey: [
      'datafiles',
      'projects',
      'listing',
      page,
      limit,
      queryString ?? '',
    ],
    queryFn: ({ signal }) =>
      getProjectListing({ page, limit, queryString, signal }),
  });
}
