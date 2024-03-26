import { useQuery } from '@tanstack/react-query';
import apiClient from '../apiClient';
import { TTapisApp, TTapisSystem } from './types';

export type TAppParamsType = {
  appId: string;
  appVersion?: string;
};

type TAppResponse = {
  definition: TTapisApp;
  exec_sys: TTapisSystem;
  license: {
    type: null | string;
    enabled?: boolean;
  };
  systemNeedsKeys?: boolean;
  pushKeysSystem?: TTapisSystem;
};

async function getApps(
  { signal }: { signal: AbortSignal },
  params: TAppParamsType
) {
  const res = await apiClient.get<{
    response: TAppResponse;
    status: number;
  }>(`/api/workspace/apps/`, {
    signal,
    params,
  });
  return res.data.response;
}

function useGetApps(queryParams: TAppParamsType) {
  return useQuery({
    queryKey: ['workspace', 'getApps', queryParams],
    queryFn: ({ signal }) => getApps({ signal }, queryParams),
  });
}

export default useGetApps;
