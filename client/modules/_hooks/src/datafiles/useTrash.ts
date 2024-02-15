import { useMutation } from '@tanstack/react-query';
import apiClient from '../apiClient';

type TCopyParam = { api: string; system: string; path: string };

function TrashFn(src: TCopyParam, dest: TCopyParam, doi?: string) {
  return apiClient.put(
    `/api/datafiles/${src.api}/private/move/${src.system}/${src.path}/${
      doi ? `?doi=${doi}` : ''
    }`,
    { dest_system: dest.system, dest_path: dest.path }
  );
}

export function useTrash() {
  return useMutation({
    mutationFn: ({
      src,
      dest,
      doi,
    }: {
      src: TCopyParam;
      dest: TCopyParam;
      doi?: string;
    }) => TrashFn(src, dest, doi),
  });
}
