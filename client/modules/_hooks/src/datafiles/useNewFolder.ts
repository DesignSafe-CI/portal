import { useMutation } from '@tanstack/react-query';
import apiClient from '../apiClient';

type TNewFolderParam = {
  api: string;
  system: string;
  path: string;
  dirName: string;
};

function newFolderFn(src: TNewFolderParam) {
  return apiClient.put(
    `/api/datafiles/${src.api}/private/mkdir/${src.system}/${src.path}/`,
    { dir_name: src.dirName }
  );
}

export function useNewFolder() {
  return useMutation({
    mutationFn: ({ src }: { src: TNewFolderParam }) => newFolderFn(src),
  });
}
