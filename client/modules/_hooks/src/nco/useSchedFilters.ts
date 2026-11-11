import { useQuery } from '@tanstack/react-query';
import apiClient from '../apiClient';

export type TNcoSchedFacilityList = {
  response: string[];
};

async function getNcoSchedFacilityListing({ signal }: { signal: AbortSignal }) {
  const resp = await apiClient.get<TNcoSchedFacilityList>(
    `/nco/api/sched_facilities`,
    {
      signal,
    }
  );
  return resp.data;
}

export function useNcoSchedFacilityListing() {
  return useQuery({
    queryKey: ['nco', 'scheduler', 'filters'],
    queryFn: ({ signal }) => getNcoSchedFacilityListing({ signal }),
  });
}
