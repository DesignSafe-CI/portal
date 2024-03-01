import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../apiClient';

async function removeFileAssociation(
  projectId: string,
  entityUuid: string,
  filePath: string
) {
  const res = await apiClient.delete(
    `/api/projects/v2/${projectId}/entities/${entityUuid}/files/${filePath}/`
  );
  return res.data;
}

export function useRemoveFileAssociation(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      filePath,
      entityUuid,
    }: {
      filePath: string;
      entityUuid: string;
    }) => removeFileAssociation(projectId, entityUuid, filePath),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ['datafiles', 'projects', 'detail', projectId],
      }),
  });
}
