import { useQuery } from '@tanstack/react-query';
import apiClient from '../../apiClient';

export interface DataciteEvent {
  attributes: {
    'relation-type-id': string;
    total: number;
  };
}

export interface DataciteEventsResponse {
  data: DataciteEvent[];
}

export async function getDataciteEvents({
  doi,
  signal,
}: {
  doi: string;
  signal: AbortSignal;
}) {
  const dataciteEvents = `/api/publications/data-cite/events?source-id=datacite-usage&doi=${encodeURIComponent(
    doi
  )}&page[size]=1000`;

  // Fetch data from both endpoints simultaneously
  const respDataciteEvents = await apiClient.get<DataciteEventsResponse>(
    dataciteEvents,
    { signal }
  );

  return respDataciteEvents.data;
}

export function useDataciteEvents(doi: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['dataciteEvents', doi],
    queryFn: async ({ signal }) => {
      return getDataciteEvents({ doi, signal });
    },
    enabled: enabled && !!doi,
  });
}
