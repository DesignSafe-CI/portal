import { useQuery } from '@tanstack/react-query';
import apiClient from '../../apiClient';

export interface Data1Item {
  attributes: {
    'relation-type-id': string;
    total: number;
  };
}

export interface Data2Attributes {
  citationCount: number;
  downloadCount: number;
  viewCount: number;
  viewsOverTime: { yearMonth: string; total: number }[];
  downloadsOverTime: { yearMonth: string; total: number }[];
  citationsOverTime: { yearMonth: string; total: number }[];
}

export interface DataciteEventsResponse {
  data: Data1Item[];
}

export interface DataciteAttributesResponse {
  data: {
    attributes: Data2Attributes;
  };
}

export type TCitationMetricsResponse = {
  data1: DataciteEventsResponse;
  data2: DataciteAttributesResponse;
};

export async function getCitationMetrics({
  doi,
  signal,
}: {
  doi: string;
  signal: AbortSignal;
}) {
  const dataciteEvents = `/api/publications/data-cite/events?source-id=datacite-usage&doi=${encodeURIComponent(
    doi
  )}`;
  const datacite = `/api/publications/data-cite/${encodeURIComponent(doi)}/`;

  // Fetch data from both endpoints simultaneously
  const [respDataciteEvents, respDatacite] = await Promise.all([
    apiClient.get<DataciteEventsResponse>(dataciteEvents, { signal }),
    apiClient.get<DataciteAttributesResponse>(datacite, { signal }),
  ]);

  return { data1: respDataciteEvents.data, data2: respDatacite.data };
}

export function useCitationMetrics(doi: string) {
  return useQuery({
    queryKey: ['citationMetrics', doi], // This should be an object
    queryFn: async ({ signal }) => {
      return getCitationMetrics({ doi, signal });
    },
    // Add any additional options you need, like refetch, stale time, etc.
  });
}
