import { useQuery } from '@tanstack/react-query';
import apiClient from '../apiClient';
import { TQueryOptionExtras } from '../queryConfig';

export type TPreviewParams = {
  api: string;
  system: string;
  scheme?: string;
  doi?: string;
  path: string;
};

export type TPreviewFileType =
  | 'text'
  | 'image'
  | 'object'
  | 'ms-office'
  | 'video'
  | 'ipynb'
  | 'box'
  | 'other'
  | 'hazmapper';

export type TFilePreviewResponse = {
  href: string;
  fileType: TPreviewFileType;

  fileMeta: Record<string, string>;
};

async function getFilePreview({
  api,
  system,
  scheme,
  path,
  doi,
  signal,
}: TPreviewParams & { signal: AbortSignal }) {
  const res = await apiClient.get<TFilePreviewResponse>(
    `/api/datafiles/${api}/${scheme}/preview/${system}/${path}`,
    { params: { doi }, signal }
  );
  return res.data;
}

export function useFilePreview({
  api,
  system,
  scheme = 'private',
  path,
  doi,
  queryOptions,
}: TPreviewParams & {
  queryOptions?: TQueryOptionExtras<TFilePreviewResponse>;
}) {
  return useQuery({
    queryKey: ['datafiles', 'preview', api, system, path],
    queryFn: ({ signal }) =>
      getFilePreview({ api, system, scheme, path, doi, signal }),
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    ...queryOptions,
  });
}
