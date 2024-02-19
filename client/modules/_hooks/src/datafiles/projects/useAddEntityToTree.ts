import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../apiClient';

async function addEntity(projectId: string, nodeId: string, uuid: string) {
  const res = await apiClient.post(
    `/api/projects/v2/${projectId}/entities/associations/${nodeId}/`,
    { uuid }
  );
  return res.data;
}

export function useAddEntityToTree(projectId: string, nodeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uuid }: { uuid: string }) =>
      addEntity(projectId, nodeId, uuid),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ['datafiles', 'projects', 'detail', projectId],
      }),
  });
}
