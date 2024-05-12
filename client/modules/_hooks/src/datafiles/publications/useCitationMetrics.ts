import { useQuery } from '@tanstack/react-query';
import apiClient from '../../apiClient';

export type TCitationMetrics = {
  attributes: {
    citationCount: number;
    downloadCount: number;
    viewCount: number;
  };
}

export type TCitationMetricsResponse = {
  data: TCitationMetrics;
};

async function getCitationMetrics({
  doi,
  signal,
}: {
  doi: string;
  signal: AbortSignal;
}) {
  const endpoint1 = `/api/publications/data-cite/events?source-id=datacite-usage&doi=${encodeURIComponent(doi)}`;
  const endpoint2 = `/api/publications/data-cite/${encodeURIComponent(doi)}/`;

  // Fetch data from both endpoints simultaneously
  const [response1, response2] = await Promise.all([
    apiClient.get<TCitationMetricsResponse>(endpoint1, { signal }),
    apiClient.get<TCitationMetricsResponse>(endpoint2, { signal }),
  ]);

  return { data1: response1.data, data2: response2.data };
}

export function useCitationMetrics(doi: string) {
  return useQuery({
    queryKey: ['datafiles', 'metrics', doi],
    queryFn: async ({ signal }) => {
      const resp1 = await apiClient.get<TCitationMetricsResponse>(
        `/api/publications/data-cite/events?source-id=datacite-usage&doi=${encodeURIComponent(doi)}`, { signal });
      const resp2 = await apiClient.get<TCitationMetricsResponse>(
        `/api/publications/data-cite/${doi}/`, { signal });
      return { data1: resp1.data, data2: resp2.data };
    },
  });
}
