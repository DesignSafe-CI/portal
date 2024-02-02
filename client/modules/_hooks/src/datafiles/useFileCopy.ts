import { useMutation } from '@tanstack/react-query';
import apiClient from '../apiClient';

type TCopyParam = { api: string; system: string; path: string };

function copyFn(src: TCopyParam, dest: TCopyParam, doi?: string) {
  return apiClient.put(
    `/api/datafiles/${src.api}/private/copy/${src.system}/${src.path}/${
      doi ? `?doi=${doi}` : ''
    }`,
    { dest_system: dest.system, dest_path: dest.path }
  );
}

export function useFileCopy() {
  return useMutation({
    mutationFn: ({
      src,
      dest,
      doi,
    }: {
      src: TCopyParam;
      dest: TCopyParam;
      doi?: string;
    }) => copyFn(src, dest, doi),
  });
}
