import { useQuery } from '@tanstack/react-query';
import apiClient from '../apiClient';
import { TFileListing } from './useFileListing';

async function getFileDetail(
  api: string,
  system: string,
  path: string,
  scheme: string = 'private',
  { signal }: { signal: AbortSignal }
) {
  const res = await apiClient.get<TFileListing>(
    `/api/datafiles/${api}/${scheme}/detail/${system}/${path}`,
    { signal }
  );
  return res.data;
}

export function useFileDetail(
  api: string,
  system: string,
  scheme: string,
  path: string,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: ['datafiles', 'fileListing', 'detail', api, scheme, system, path],
    queryFn: ({ signal }) =>
      getFileDetail(api, system, path, scheme, { signal }),
    enabled: !!path && enabled,
  });
}
