import { useQuery } from '@tanstack/react-query';
import apiClient from '../../apiClient';

async function getProjectDetail({
  projectId,
  signal,
}: {
  projectId: string;
  signal: AbortSignal;
}) {
  const resp = await apiClient.get(`/api/projects/v2/${projectId}/`, {
    signal,
  });
  return resp.data;
}

export function useProjectDetail(projectId: string) {
  return useQuery({
    queryKey: ['datafiles', 'projects', 'detail', projectId],
    queryFn: ({ signal }) => getProjectDetail({ projectId, signal }),
    enabled: !!projectId
  });
}
