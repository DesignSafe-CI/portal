import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../apiClient';

async function patchProjectMetadata(
  projectId: string,
  patchMetadata: Record<string, unknown>
) {
  // Replace undefined with null so that deleted values are unset instead of ignored.
  Object.keys(patchMetadata).forEach((k) => {
    if (patchMetadata[k] === undefined) {
      patchMetadata[k] = null;
    }
  });
  const res = await apiClient.patch(`/api/projects/v2/${projectId}/`, {
    patchMetadata,
  });
  return res.data;
}

export function usePatchProjectMetadata(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      patchMetadata,
    }: {
      patchMetadata: Record<string, unknown>;
    }) => patchProjectMetadata(projectId, patchMetadata),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ['datafiles', 'projects', 'detail', projectId],
      }),
  });
}
