import { useQuery } from '@tanstack/react-query';

interface TapisFileAuditResponse {
  data: TapisFilesAuditEntry[];
}

export interface TapisFilesAuditEntry {
  writer_logtime: string;
  jwt_user: string;
  action: string;
  target_path: string;
}

async function fetchFileHistory(
  filename: string
): Promise<TapisFileAuditResponse> {
  const response = await fetch(`/audit/api/user/${filename}/tapis`);
  if (!response.ok) throw new Error(`API Error: ${response.status}`);
  return response.json();
}

export function useGetFileHistory(filename: string, enabled: boolean) {
  return useQuery<TapisFileAuditResponse, Error>({
    queryKey: ['fileHistory', filename],
    queryFn: () => fetchFileHistory(filename),
    enabled,
  });
}
