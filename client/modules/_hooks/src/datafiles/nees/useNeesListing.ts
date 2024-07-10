import { useQuery } from '@tanstack/react-query';
import apiClient from '../../apiClient';

export type TNeesListingItem = {
  path: string;
  project: string;
  pis: {
    lastName: string;
    firstName: string;
  }[];
  title: string;
  startDate: string;
  description: string;
};

export type TNeesListingResponse = {
  listing: TNeesListingItem[];
};

async function getNeesListing({
  page = 1,
  limit = 100,
  signal,
  query_string,
}: {
  page: number;
  limit: number;
  signal: AbortSignal;
  query_string: String;
}) {
  const resp = await apiClient.get<TNeesListingResponse>(
    `/api/publications/neeslisting/${query_string ? '?' + query_string : ''}`,
    {
      signal,
      params: { offset: (page - 1) * limit, limit },
    }
  );
  return resp.data;
}

export function useNeesListing(page: number, limit: number, query_string: String) {
  return useQuery({
    queryKey: ['datafiles', 'nees', 'listing', page, limit, query_string],
    queryFn: ({ signal }) => getNeesListing({ page, limit, signal, query_string }),
  });
}
