import {
  useQuery,
  useSuspenseQuery,
  useQueryClient,
} from '@tanstack/react-query';
import apiClient from '../apiClient';
import { TTapisApp } from './types';
import { TTapisSystem } from '../systems/types';

export type TAppParamsType = {
  appId: string;
  appVersion?: string;
};

export type TAppResponse = {
  definition: TTapisApp;
  license: {
    type?: string;
    enabled?: boolean;
  };
  defaultSystemNeedsKeys?: TTapisSystem;
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

const getAppsQuery = (queryParams: TAppParamsType) => ({
  queryKey: ['workspace', 'getApps', queryParams],
  queryFn: ({ signal }: { signal: AbortSignal }) =>
    getApps({ signal }, queryParams),
  staleTime: 5000,
});

export const useGetAppsSuspense = (queryParams: TAppParamsType) => {
  return useSuspenseQuery(getAppsQuery(queryParams));
};

const useGetApps = (queryParams: TAppParamsType) => {
  return useQuery(getAppsQuery(queryParams));
};

export const usePrefetchGetApps = (queryParams: TAppParamsType) => {
  const queryClient = useQueryClient();
  queryParams.appId && queryClient.ensureQueryData(getAppsQuery(queryParams));
};

export default useGetApps;
