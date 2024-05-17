import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../apiClient';

async function createEntity(
  projectId: string,
  formData: { name: string; value: Record<string, unknown> }
) {
  // Replace undefined with null so that deleted values are unset instead of ignored.
  const res = await apiClient.post(
    `/api/projects/v2/${projectId}/entities/create/`,
    formData
  );
  return res.data;
}

export function useCreateEntity(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      formData,
    }: {
      formData: {
        name: string;
        value: Record<string, unknown>;
      };
    }) => createEntity(projectId, formData),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ['datafiles', 'projects', 'detail', projectId],
      }),
  });
}
