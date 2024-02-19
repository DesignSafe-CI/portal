import { useMutation } from '@tanstack/react-query';
import apiClient from '../apiClient';

type TRenameParam = { api: string; system: string; path: string; name: string };

function renameFn(src: TRenameParam, dest: TRenameParam, doi?: string) {
  return apiClient.put(
    `/api/datafiles/${src.api}/private/rename/${src.system}/${src.path}/${src.name}/`,
    { new_name: dest.name }
  );
}

export function useRename() {
  return useMutation({
    mutationFn: ({
      src,
      dest,
      doi,
    }: {
      src: TRenameParam;
      dest: TRenameParam;
      doi?: string;
    }) => renameFn(src, dest, doi),
  });
}
