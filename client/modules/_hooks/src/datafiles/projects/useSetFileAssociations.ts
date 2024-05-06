import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../apiClient';
import { TFileObj } from './types';

async function setFileAssociations(
  projectId: string,
  entityUuid: string,
  fileObjs: TFileObj[]
) {
  const res = await apiClient.put(
    `/api/projects/v2/${projectId}/entities/${entityUuid}/files/`,
    { fileObjs }
  );
  return res.data;
}

// Use for REPLACING all file associations for an entity, e.g. when setting selected
// files to publish for a type Other publications.
export function useSetFileAssociations(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      fileObjs,
      entityUuid,
    }: {
      fileObjs: TFileObj[];
      entityUuid: string;
    }) => setFileAssociations(projectId, entityUuid, fileObjs),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ['datafiles', 'projects', 'detail', projectId],
      }),
  });
}
