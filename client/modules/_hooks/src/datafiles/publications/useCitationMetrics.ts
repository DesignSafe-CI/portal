import { useQuery } from '@tanstack/react-query';
import apiClient from '../../apiClient';

export type TCitationMetrics = {
  data: { attributes: { 'relation-type-id': string; total: number } }[];
  attributes: {
    citationCount: number;
    downloadCount: number;
    viewCount: number;
    viewsOverTime?: { yearMonth: string; total: number }[];
    downloadsOverTime?: { yearMonth: string; total: number }[];
  };
};

export type TCitationMetricsResponse = {
  data: TCitationMetrics;
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
    apiClient.get<TCitationMetricsResponse>(dataciteEvents, { signal }),
    apiClient.get<TCitationMetricsResponse>(datacite, { signal }),
  ]);

  return { data1: respDataciteEvents.data, data2: respDatacite.data };
}

export function useCitationMetrics(doi: string) {
  return useQuery({
    queryKey: ['datafiles', 'metrics', doi],
    queryFn: async ({ signal }) => {
      const resp1 = await apiClient.get<TCitationMetricsResponse>(
        `/api/publications/data-cite/events?source-id=datacite-usage&doi=${encodeURIComponent(
          doi
        )}`,
        { signal }
      );
      const resp2 = await apiClient.get<TCitationMetricsResponse>(
        `/api/publications/data-cite/${doi}/`,
        { signal }
      );
      return { data1: resp1.data, data2: resp2.data };
    },
  });
}
