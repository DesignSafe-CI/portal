import { useQuery } from '@tanstack/react-query';
import apiClient from '../../apiClient';
import { useSearchParams } from 'react-router-dom';

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
  searchString,
  signal,
}: {
  page: number;
  limit: number;
  searchString: string;
  signal: AbortSignal;
}) {
  const resp = await apiClient.get<TPublishedListingResponse>(
    `/api/publications/v2${searchString ? '?' + searchString : ''}`,
    {
      signal,
      params: { offset: (page - 1) * limit, limit },
    }
  );
  return resp.data;
}

export function usePublishedListing(page: number, limit: number) {
  const [searchParams] = useSearchParams();
  const searchString = searchParams.toString();
  return useQuery({
    queryKey: ['datafiles', 'published', 'listing', page, limit, searchString],
    queryFn: ({ signal }) =>
      getPublishedListing({ page, limit, searchString, signal }),
  });
}
