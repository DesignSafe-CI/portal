import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../apiClient';

type TNewFolderParam = {
  api: string;
  system: string;
  path: string;
  dirName: string;
};

function newFolderFn(src: TNewFolderParam) {
  return apiClient.put(
    `/api/datafiles/${src.api}/private/mkdir/${src.system}/${src.path}${
      src.path ? '/' : '' // Only append trailing slash if path is not empty
    }`,
    { dir_name: src.dirName }
  );
}

export function useNewFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ src }: { src: TNewFolderParam }) => newFolderFn(src),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ['datafiles', 'fileListing'],
      }),
  });
}
