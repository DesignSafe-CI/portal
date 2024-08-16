import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../apiClient';

async function createProject(projectValue: Record<string, unknown>) {
  // Replace undefined with null so that deleted values are unset instead of ignored.
  Object.keys(projectValue).forEach((k) => {
    if (projectValue[k] === undefined) {
      projectValue[k] = null;
    }
  });
  const res = await apiClient.post(`/api/projects/v2/`, {
    value: projectValue,
  });
  return res.data;
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ projectValue }: { projectValue: Record<string, unknown> }) =>
      createProject(projectValue),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ['datafiles', 'projects'],
      }),
  });
}
