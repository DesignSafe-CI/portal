import { useQuery } from '@tanstack/react-query';
import apiClient from '../apiClient';

export type TPortalApp = {
  app_id: string;
  app_type: string;
  bundle_category: string;
  bundle_href: string;
  bundle_id: number;
  bundle_label: string;
  html?: string;
  icon?: string;
  is_bundled: boolean;
  label: string;
  shortLabel?: string;
  version?: string;
};

export type TAppCategory = {
  apps: TPortalApp[];
  priority: number;
  title: string;
};

export type TAppCategories = {
  categories: TAppCategory[];
  htmlDefinitions: { [dynamic: string]: TPortalApp };
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
