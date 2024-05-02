import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import apiClient from '../apiClient';
import { TTapisSystem } from './types';

export type TSystemParamsType = {
  systemId?: string;
};

export type TSystemsResponse = {
  executionSystems: [TTapisSystem];
  storageSystems: [TTapisSystem];
  defaultStorageSystem: TTapisSystem;
};

export type TGetSystemsResponse = {
  response: TSystemsResponse;
  status: number;
};

async function getSystems({ systemId }: { systemId?: string }) {
  const res = await apiClient.get<TGetSystemsResponse>(
    systemId ? `/api/workspace/systems/${systemId}` : `/api/workspace/systems`
  );
  return res.data.response;
}

export const getSystemsQuery = (systemId?: string) => ({
  queryKey: ['workspace', 'getSystems', systemId],
  queryFn: () => getSystems({ systemId }),
  staleTime: 1000 * 60 * 5, // 5 minute stale time
});

function useGetSystems(systemId?: string) {
  return useSuspenseQuery(getSystemsQuery(systemId));
  // return useQuery(getSystemsQuery(queryParams));
}

export default useGetSystems;
