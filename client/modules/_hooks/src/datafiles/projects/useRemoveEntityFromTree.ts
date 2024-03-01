import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../apiClient';

async function removeEntity(projectId: string, nodeId: string) {
  const res = await apiClient.delete(
    `/api/projects/v2/${projectId}/entities/associations/${nodeId}/`
  );
  return res.data;
}

export function useRemoveEntityFromTree(projectId: string, nodeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => removeEntity(projectId, nodeId),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ['datafiles', 'projects', 'detail', projectId],
      }),
  });
}
