import { useQuery } from '@tanstack/react-query';
import apiClient from '../../apiClient';

export type TPublicationListingItem = {
  projectId: string;
  title: string;
  description: string;
  pi: { fname: string; lname: string; email: string; inst: string };
  created: string;
};

export type TPublishedListingResponse = {
  total: number;
  result: TPublicationListingItem[];
};

async function getPublishedListing({
  page = 1,
  limit = 100,
  signal,
}: {
  page: number;
  limit: number;
  signal: AbortSignal;
}) {
  const resp = await apiClient.get<TPublishedListingResponse>(
    '/api/publications/v2',
    {
      signal,
      params: { offset: (page - 1) * limit, limit },
    }
  );
  return resp.data;
}

export function usePublishedListing(page: number, limit: number) {
  return useQuery({
    queryKey: ['datafiles', 'published', 'listing', page, limit],
    queryFn: ({ signal }) => getPublishedListing({ page, limit, signal }),
  });
}
