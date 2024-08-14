import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../apiClient';

type TUploadFileParam = {
  api: string;
  system: string;
  scheme?: string;
  path: string;
  uploaded_file: FormData;
};

function uploadFileFn(params: TUploadFileParam) {
  const { api, system, scheme, path, uploaded_file } = params;
  return apiClient.post(
    `/api/datafiles/${api}/${scheme}/upload/${system}/${path}${
      path ? '/' : '' // Only append trailing slash if path is not empty
    }`,
    uploaded_file
  );
}

export function useUploadFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: TUploadFileParam) => {
      return uploadFileFn(params);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ['datafiles', 'fileListing'],
      }),
  });
}
