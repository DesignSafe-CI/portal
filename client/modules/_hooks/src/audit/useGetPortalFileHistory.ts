import { useQuery } from '@tanstack/react-query';

export interface FileHistoryResponse {
  file_name: string;
  timelines: Timeline[];
}

export interface Timeline {
  id: number;
  timeline_file_name: string;
  first_appearance: string;
  last_activity: string;
  event_count: number;
  user: string;
  host: string;
  path: string;
  events: TimelineEvent[];
}

export interface TimelineEvent {
  timestamp: string;
  action: string;
  username: string;
  details: Record<string, unknown>;
}

async function fetchPortalFileHistory(
  filename: string
): Promise<FileHistoryResponse> {
  const encoded = encodeURIComponent(filename);
  const response = await fetch(`/audit/api/file/${encoded}/portal/combined/`);
  if (!response.ok) throw new Error(`API Error: ${response.status}`);
  return response.json();
}

export function useGetPortalFileHistory(filename: string, enabled: boolean) {
  return useQuery<FileHistoryResponse, Error>({
    queryKey: ['portalFileHistory', filename],
    queryFn: () => fetchPortalFileHistory(filename),
    enabled,
  });
}
