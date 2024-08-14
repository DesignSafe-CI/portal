import { useQuery } from '@tanstack/react-query';
import apiClient from '../../apiClient';

export interface DataciteAttributes {
  citationCount: number;
  downloadCount: number;
  viewCount: number;
  viewsOverTime: { yearMonth: string; total: number }[];
  downloadsOverTime: { yearMonth: string; total: number }[];
  citationsOverTime: { yearMonth: string; total: number }[];
}

export interface DataciteAttributesResponse {
  data: {
    attributes: DataciteAttributes;
  };
}

export async function getDataciteMetrics({
  doi,
  signal,
}: {
  doi: string;
  signal: AbortSignal;
}) {
  const datacite = `/api/publications/data-cite/${encodeURIComponent(doi)}/`;

  // Fetch data from both endpoints simultaneously
  const respDatacite = await apiClient.get<DataciteAttributesResponse>(
    datacite,
    { signal }
  );

  return respDatacite.data;
}

export function useDataciteMetrics(doi: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['dataciteMetrics', doi],
    queryFn: async ({ signal }) => {
      return getDataciteMetrics({ doi, signal });
    },
    enabled: enabled && !!doi,
    retry: false,
  });
}
