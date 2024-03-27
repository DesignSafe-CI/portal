import { useQuery } from '@tanstack/react-query';
import apiClient from '../../apiClient';
import { TBaseProjectValue } from '../projects';

export type TPublicationDetailResponse = {
  tree: unknown;
  baseProject: TBaseProjectValue;
};

async function getPublicationDetail({
  projectId,
  signal,
}: {
  projectId: string;
  signal: AbortSignal;
}) {
  const resp = await apiClient.get<TPublicationDetailResponse>(
    `/api/publications/v2/${projectId}`,
    {
      signal,
    }
  );
  return resp.data;
}

export function usePublicationDetail(projectId: string) {
  return useQuery({
    queryKey: ['datafiles', 'published', projectId],
    queryFn: ({ signal }) => getPublicationDetail({ projectId, signal }),
  });
}
