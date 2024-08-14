import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../apiClient';

async function versionProject(
  projectId: string,
  entityUuids: string[],
  versionInfo: string
) {
  const res = await apiClient.post(`/api/publications/v2/version/`, {
    projectId,
    entityUuids,
    versionInfo,
  });
  return res.data;
}

export function useVersionProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      projectId,
      entityUuids,
      versionInfo,
    }: {
      projectId: string;
      entityUuids: string[];
      versionInfo: string;
    }) => versionProject(projectId, entityUuids, versionInfo),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ['datafiles', 'published'],
      }),
  });
}
