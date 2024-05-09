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
  const resp = await apiClient.get<TCitationMetricsResponse>(
    `/api/publications/data-cite/${doi}/`, { signal });
  console.log("API Response:", resp);

  return resp.data;
}

export function useCitationMetrics(doi: string) {
  return useQuery({
    queryKey: ['datafiles', 'metrics', doi],
    queryFn: ({ signal }) => getCitationMetrics({ doi, signal }),
  });
}
