import { useMutation } from '@tanstack/react-query';
import apiClient from '../apiClient';

type TrashParam = { api: string; system: string; path: string };

function TrashFn(src: TrashParam, dest: TrashParam) {
  return apiClient.put(
    `/api/datafiles/${src.api}/private/trash/${src.system}/${src.path}/`,
    { trash_path: dest.path }
  );
}

export function useTrash() {
  return useMutation({
    mutationFn: ({
      src,
      dest,
    }: {
      src: TrashParam;
      dest: TrashParam;
    }) => TrashFn(src, dest),
  });
}
