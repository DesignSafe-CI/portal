import { useQuery } from '@tanstack/react-query';

interface TapisFileAuditResponse {
  data: TapisFileAuditEntry[];
}

export interface TapisFileAuditEntry {
  writer_logtime: string; //date&time
  obo_user: string; //user
  action: string; //action
  target_path: string; //path flow - maybe location
  source_path: string; //path flow - maybe location
  data: object; //details
}

async function fetchTapisFileHistory(
  filename: string
): Promise<TapisFileAuditResponse> {
  const encoded = encodeURIComponent(filename);
  const response = await fetch(`/audit/api/file/${encoded}/tapis/`);
  if (!response.ok) throw new Error(`API Error: ${response.status}`);
  return response.json();
}

export function useGetTapisFileHistory(filename: string, enabled: boolean) {
  return useQuery<TapisFileAuditResponse, Error>({
    queryKey: ['fileHistory', filename],
    queryFn: () => fetchTapisFileHistory(filename),
    enabled,
  });
}
