import { useQuery } from '@tanstack/react-query';
import apiClient from '../../apiClient';
import { TBaseProject, TEntityMeta, TPreviewTreeData } from './types';

type TProjectPreviewResponse = {
  baseProject: TBaseProject;
  entities: TEntityMeta[];
  tree: TPreviewTreeData;
};

async function getProjectPreview({
  projectId,
  signal,
}: {
  projectId: string;
  signal: AbortSignal;
}) {
  const resp = await apiClient.get<TProjectPreviewResponse>(
    `/api/projects/v2/${projectId}/preview/`,
    {
      signal,
    }
  );
  return resp.data;
}

export function useProjectPreview(projectId: string) {
  return useQuery({
    queryKey: ['datafiles', 'projects', 'detail', projectId, 'preview'],
    queryFn: ({ signal }) => getProjectPreview({ projectId, signal }),
    enabled: !!projectId,
  });
}
