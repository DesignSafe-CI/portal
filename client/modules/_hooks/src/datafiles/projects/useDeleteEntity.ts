import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../apiClient';

async function deleteEntity(entityUuid: string) {
  const res = await apiClient.delete(
    `/api/projects/v2/entities/${entityUuid}/`
  );
  return res.data;
}

export function useDeleteEntity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ entityUuid }: { entityUuid: string }) =>
      deleteEntity(entityUuid),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ['datafiles', 'projects', 'detail'],
      }),
  });
}
