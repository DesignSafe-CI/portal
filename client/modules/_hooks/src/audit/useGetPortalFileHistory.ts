import { useQuery } from '@tanstack/react-query';

interface PortalFileAuditResponse {
  data: PortalFileAuditEntry[];
}

export interface PortalFileAuditEntry {
  timestamp: string;
  portal: string;
  username: string;
  action: string;
  tracking_id: string;
  data: object;
}

async function fetchPortalFileHistory(
  filename: string
): Promise<PortalFileAuditResponse> {
  const encoded = encodeURIComponent(filename);
  const response = await fetch(`/audit/api/file/${encoded}/portal/`);
  if (!response.ok) throw new Error(`API Error: ${response.status}`);
  return response.json();
}

export function useGetPortalFileHistory(filename: string, enabled: boolean) {
  return useQuery<PortalFileAuditResponse, Error>({
    queryKey: ['portalFileHistory', filename],
    queryFn: () => fetchPortalFileHistory(filename),
    enabled,
  });
}
