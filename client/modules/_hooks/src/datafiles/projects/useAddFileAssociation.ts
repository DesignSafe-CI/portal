import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../apiClient';
import { TFileObj } from './types';

async function addFileAssociation(
  projectId: string,
  entityUuid: string,
  fileObjs: TFileObj[]
) {
  const res = await apiClient.patch(
    `/api/projects/v2/${projectId}/entities/${entityUuid}/files/`,
    { fileObjs }
  );
  return res.data;
}

export function useAddFileAssociation(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      fileObjs,
      entityUuid,
    }: {
      fileObjs: TFileObj[];
      entityUuid: string;
    }) => addFileAssociation(projectId, entityUuid, fileObjs),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ['datafiles', 'projects', 'detail', projectId],
      }),
  });
}
