import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../apiClient';

async function patchEntityMetadata(
  entityUuid: string,
  patchMetadata: Record<string, unknown>
) {
  // Replace undefined with null so that deleted values are unset instead of ignored.
  Object.keys(patchMetadata).forEach((k) => {
    if (patchMetadata[k] === undefined) {
      patchMetadata[k] = null;
    }
  });
  const res = await apiClient.patch(
    `/api/projects/v2/entities/${entityUuid}/`,
    { patchMetadata }
  );
  return res.data;
}

export function usePatchEntityMetadata() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      entityUuid,
      patchMetadata,
    }: {
      patchMetadata: Record<string, unknown>;
      entityUuid: string;
    }) => patchEntityMetadata(entityUuid, patchMetadata),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ['datafiles', 'projects', 'detail'],
      }),
  });
}
