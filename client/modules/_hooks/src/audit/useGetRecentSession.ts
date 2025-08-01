import { useQuery } from '@tanstack/react-query';

interface PortalAuditResponse {
  data: PortalAuditEntry[];
}

export interface PortalAuditEntry {
  session_id: string;
  timestamp: string;
  portal: string;
  username: string;
  action: string;
  tracking_id: string;
  data: object;
}

async function fetchPortalAudit(
  username: string
): Promise<PortalAuditResponse> {
  const response = await fetch(`/audit/api/user/${username}/portal`); //??
  if (!response.ok) {
    throw new Error(
      `API request failed: ${response.status} ${response.statusText}`
    );
  }
  return response.json();
}

export function useGetRecentSession(username: string, enabled: boolean) {
  return useQuery<PortalAuditResponse, Error>({
    queryKey: ['audit', username],
    queryFn: () => fetchPortalAudit(username),
    enabled,
  });
}
