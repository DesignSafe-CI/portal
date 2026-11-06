import { useQuery } from '@tanstack/react-query';
import apiClient from '../apiClient';
import { useSearchParams } from 'react-router-dom';

export type TNcoGrantsItem = {
  AwardNumber: string;
  Title: string;
  StartDate: {
    $date: number;
  };
  EndDate: {
    $date: number;
  };
  PiName: string;
  CoPiNames: string;
  Org: string;
  NheriFacility: string;
  Hazard: string;
  Type: string;
  Subjects: string[];
  Abstract: string;
};

export type TNcoGrantsListing = {
  response: TNcoGrantsItem[];
};

async function getNcoGrantsListing({
  searchString,
  signal,
}: {
  searchString: string;
  signal: AbortSignal;
}) {
  const resp = await apiClient.get<TNcoGrantsListing>(
    `/nco/api/ttc_grants${searchString ? '?' + searchString : ''}`,
    {
      signal,
    }
  );
  return resp.data;
}

export function useNcoGrantsListing() {
  const [searchParams] = useSearchParams();
  const searchString = searchParams.toString();

  return useQuery({
    queryKey: ['nco', 'listing', 'grants', searchString],
    queryFn: ({ signal }) => getNcoGrantsListing({ searchString, signal }),
  });
}
