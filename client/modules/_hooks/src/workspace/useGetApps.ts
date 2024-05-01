import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import apiClient from '../apiClient';
import { TTapisApp, TTapisSystem } from './types';

export type TAppParamsType = {
  appId: string;
  appVersion?: string;
};

export type TAppResponse = {
  definition: TTapisApp;
  execSystems: [TTapisSystem];
  license: {
    type: null | string;
    enabled?: boolean;
  };
  defaultSystemNeedsKeys?: TTapisSystem;
  defaultSystemId?: string;
};

export type TGetAppsResponse = {
  response: TAppResponse;
  status: number;
};

async function getApps(
  { signal }: { signal: AbortSignal },
  params: TAppParamsType
) {
  const res = await apiClient.get<TGetAppsResponse>(`/api/workspace/apps/`, {
    signal,
    params,
  });
  return res.data.response;
}

export const getAppsQuery = (queryParams: TAppParamsType) => ({
  queryKey: ['workspace', 'getApps', queryParams],
  queryFn: ({ signal }) => getApps({ signal }, queryParams),
  staleTime: 5000,
});

function useGetApps(queryParams: TAppParamsType) {
  return useSuspenseQuery(getAppsQuery(queryParams));
  // return useQuery(getAppsQuery(queryParams));
}

export default useGetApps;
