import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../apiClient';

async function amendProject(projectId: string) {
  const res = await apiClient.post(`/api/publications/v2/amend/`, {
    projectId,
  });
  return res.data;
}

export function useAmendProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId }: { projectId: string }) =>
      amendProject(projectId),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ['datafiles', 'published'],
      }),
  });
}
