import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../apiClient';

async function reorderEntitity(
  projectId: string,
  nodeId: string,
  order: number
) {
  const res = await apiClient.put(
    `/api/projects/v2/${projectId}/entities/ordering/`,
    { nodeId, order }
  );
  return res.data;
}

export function useProjectEntityReorder(projectId: string, nodeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ order }: { order: number }) =>
      reorderEntitity(projectId, nodeId, order),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ['datafiles', 'projects', 'detail', projectId],
      }),
  });
}
