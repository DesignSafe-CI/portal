import { useQuery } from '@tanstack/react-query';

/* Will change depending on requirements for tapis file audit UI /// not being used */
export interface TapisFilesAuditEntry {
  writer_logtime: string;
  action: string;
  jwt_tenant: string;
  jwt_user: string;
  target_system_id: string;
  target_path: string;
  source_path: string;
  tracking_id: string;
  parent_tracking_id: string;
  data: object;
}

interface TapisFileAuditResponse {
  data: TapisFilesAuditEntry[];
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
