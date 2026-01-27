import { useQuery } from '@tanstack/react-query';

export async function fetchPortalUsernames(): Promise<string[]> {
  const response = await fetch('/audit/api/usernames/portal');
  if (!response.ok) throw new Error('Failed to fetch usernames');
  const data = await response.json();
  return data.usernames || [];
}

export function useGetUsernames() {
  return useQuery<string[], Error>({
    queryKey: ['portalUsernames'],
    queryFn: fetchPortalUsernames,
  });
}
