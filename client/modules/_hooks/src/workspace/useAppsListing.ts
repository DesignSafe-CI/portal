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

export type TAppCategory = {
  apps: PortalApp[];
  priority: number;
  title: string;
};

export type TAppCategories = {
  categories: TAppCategory[];
};

async function getAppsListing() {
  const res = await apiClient.get<TAppCategories>(`/api/workspace/tray/`);
  return res.data;
}

export const appsListingQuery = {
  queryKey: ['workspace', 'appsListing'],
  queryFn: getAppsListing,
  staleTime: 1000 * 60 * 5, // 5 minute stale time
  refetchOnMount: false,
};

function useAppsListing() {
  return useQuery(appsListingQuery);
}

export default useAppsListing;
