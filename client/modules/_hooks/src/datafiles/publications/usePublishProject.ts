import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../apiClient';

async function publishProject(projectId: string, entityUuids: string[]) {
  // Replace undefined with null so that deleted values are unset instead of ignored.
  const res = await apiClient.post(`/api/publications/v2/publish/`, {
    projectId,
    entityUuids,
  });
  return res.data;
}

export function usePublishProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      projectId,
      entityUuids,
    }: {
      projectId: string;
      entityUuids: string[];
    }) => publishProject(projectId, entityUuids),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ['datafiles', 'published'],
      }),
  });
}
