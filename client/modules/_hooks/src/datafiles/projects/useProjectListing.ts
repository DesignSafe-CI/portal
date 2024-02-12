import { useQuery } from '@tanstack/react-query';
import apiClient from '../../apiClient';
import { TBaseProject } from './types';

export type TProjectListingResponse = {
  total: number;
  result: TBaseProject[];
};

async function getProjectListing({
  page = 1,
  limit = 100,
  signal,
}: {
  page: number;
  limit: number;
  signal: AbortSignal;
}) {
  const resp = await apiClient.get<TProjectListingResponse>(
    '/api/projects/v2',
    {
      signal,
      params: { offset: (page - 1) * limit, limit },
    }
  );
  return resp.data;
}

export function useProjectListing(page: number, limit: number) {
  return useQuery({
    queryKey: ['datafiles', 'projects', 'listing', page, limit],
    queryFn: ({ signal }) => getProjectListing({ page, limit, signal }),
  });
}
