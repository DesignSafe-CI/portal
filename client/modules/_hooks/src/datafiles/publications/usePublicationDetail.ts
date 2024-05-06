import { useQuery } from '@tanstack/react-query';
import apiClient from '../../apiClient';
import { TBaseProjectValue, TEntityValue } from '../projects';

export type TPublicationTree<T> = {
  name: string;
  uuid: string;
  id: string;
  basePath: string;
  value: T;
  publicationDate: string;
  status: string;
  order: number;
  version?: number;
  children: TPublicationTree<TEntityValue>[];
};

export type TPublicationDetailResponse = {
  tree: TPublicationTree<TBaseProjectValue | undefined>;
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
