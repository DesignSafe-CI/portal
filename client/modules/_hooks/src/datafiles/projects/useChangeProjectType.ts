import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../apiClient';

async function changeProjectType(
  projectId: string,
  value: Record<string, unknown>,
  sensitiveData: boolean
) {
  // Replace undefined with null so that deleted values are unset instead of ignored.
  Object.keys(value).forEach((k) => {
    if (value[k] === undefined) {
      value[k] = null;
    }
  });
  const res = await apiClient.put(`/api/projects/v2/${projectId}/`, {
    value,
    sensitiveData,
  });
  return res.data;
}

export function useChangeProjectType(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      value,
      sensitiveData,
    }: {
      value: Record<string, unknown>;
      sensitiveData: boolean;
    }) => changeProjectType(projectId, value, sensitiveData),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ['datafiles', 'projects', 'detail', projectId],
      }),
  });
}
