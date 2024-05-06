import { useMutation } from '@tanstack/react-query';
import apiClient from '../../apiClient';

export type TPipelineValidationResult = {
  errorType: string;
  name: string;
  title: string;
  missing: string[];
};

async function validateEntitySelection(
  projectId: string,
  entityUuids: string[]
) {
  const res = await apiClient.post<{ result: TPipelineValidationResult[] }>(
    `/api/projects/v2/${projectId}/entities/validate/`,
    { entityUuids }
  );
  return res.data;
}

export function useValidateEntitySelection() {
  return useMutation({
    mutationFn: ({
      projectId,
      entityUuids,
    }: {
      projectId: string;
      entityUuids: string[];
    }) => validateEntitySelection(projectId, entityUuids),
  });
}
