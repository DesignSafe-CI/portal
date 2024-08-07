import { useQuery } from '@tanstack/react-query';
import apiClient from '../../apiClient';
import { useSearchParams } from 'react-router-dom';

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
  total: number;
  listing: TNeesListingItem[];
};

async function getNeesListing({
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
  const resp = await apiClient.get<TNeesListingResponse>(
    `/api/publications/neeslisting/${searchString ? '?' + searchString : ''}`,
    {
      signal,
      params: { offset: (page - 1) * limit, limit },
    }
  );
  return resp.data;
}

export function useNeesListing(page: number, limit: number) {
  const [searchParams] = useSearchParams();
  const searchString = searchParams.toString();
  return useQuery({
    queryKey: ['datafiles', 'nees', 'listing', page, limit, searchString],
    queryFn: ({ signal }) =>
      getNeesListing({ page, limit, searchString, signal }),
  });
}
