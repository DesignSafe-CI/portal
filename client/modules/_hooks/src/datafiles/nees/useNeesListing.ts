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
}: {
  page: number;
  limit: number;
  signal: AbortSignal;
}) {
  const resp = await apiClient.get<TNeesListingResponse>(
    '/api/publications/neeslisting',
    {
      signal,
      params: { offset: (page - 1) * limit, limit },
    }
  );
  return resp.data;
}

export function useNeesListing(page: number, limit: number) {
  return useQuery({
    queryKey: ['datafiles', 'nees', 'listing', page, limit],
    queryFn: ({ signal }) => getNeesListing({ page, limit, signal }),
  });
}
