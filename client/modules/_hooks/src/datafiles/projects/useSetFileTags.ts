import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../apiClient';

async function setFileTags(
  projectId: string,
  entityUuid: string,
  filePath: string,
  tagNames: string[]
) {
  const res = await apiClient.put(
    `/api/projects/v2/${projectId}/entities/${entityUuid}/file-tags/${filePath}/`,
    { tagNames }
  );
  return res.data;
}

export function useSetFileTags(
  projectId: string,
  entityUuid: string,
  filePath: string
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tagNames }: { tagNames: string[] }) =>
      setFileTags(projectId, entityUuid, filePath, tagNames),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ['datafiles', 'projects', 'detail', projectId],
      }),
  });
}
