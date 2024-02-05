import { useQuery } from '@tanstack/react-query';
import apiClient from '../../apiClient';

export type TProjectListingItem = {
  uuid: string,
  lastUpdated: string,
  value: {
    title: string,
    projectId: string,
    users: {
      fname: string,
      lname: string,
      role: string,
      email: string,
      inst: string
    }[]
  }
}

export type TProjectListingResponse = {
  total: number,
  result: TProjectListingItem[]
}

async function getProjectListing({
  page = 1,
  limit = 100,
  signal,
}: {
  page: number;
  limit: number;
  signal: AbortSignal;
}) {

  const resp = await apiClient.get<TProjectListingResponse>('/api/projects/v2', {
    signal,
    params: { offset: (page - 1) * limit, limit },
  });
  return resp.data;
}

export function useProjectListing(page: number, limit: number) {
  return useQuery({
    queryKey: ['datafiles', 'projects', 'listing', page, limit],
    queryFn: ({ signal }) => getProjectListing({ page, limit, signal }),
  });
}
