import { useQuery } from '@tanstack/react-query';
import apiClient from '../apiClient';

type PortalApp = {
  app_id: string;
  app_type: string;
  bundle_id: number;
  bundle_label: string;
  html?: string;
  icon?: string;
  is_bundled: boolean;
  label: string;
  version?: string;
};

type AppCategory = {
  apps: PortalApp[];
  priority: number;
  title: string;
};

export type AppCategories = {
  categories: AppCategory[];
};

async function getAppsListing({ signal }: { signal: AbortSignal }) {
  const res = await apiClient.get<AppCategories>(`/api/workspace/tray`, {
    signal,
  });
  return res.data;
}

function useAppsListing() {
  return useQuery({
    queryKey: ['workspace', 'appsListing'],
    queryFn: getAppsListing,
    staleTime: 1000,
  });
}

export default useAppsListing;
