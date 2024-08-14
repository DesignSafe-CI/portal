import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../apiClient';

type TUploadFolderParam = {
  api: string;
  system: string;
  scheme?: string;
  path: string;
  uploaded_folder: FormData;
};

function uploadFolderFn(params: TUploadFolderParam) {
  const { api, system, scheme, path, uploaded_folder } = params;
  return apiClient.post(
    `/api/datafiles/${api}/${scheme}/upload/${system}/${path}${
      path ? '/' : '' // Only append trailing slash if path is not empty
    }`,
    uploaded_folder
  );
}

export function useUploadFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: TUploadFolderParam) => {
      return uploadFolderFn(params);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ['datafiles', 'fileListing'],
      }),
  });
}
