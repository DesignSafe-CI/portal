import { useMutation } from '@tanstack/react-query';
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
    `/api/datafiles/${api}/${scheme}/upload/${system}/${path}/`,
     uploaded_folder 
  );
}

export function useUploadFolder() {
  return useMutation({
    mutationFn: (params: TUploadFolderParam) => {
      return uploadFolderFn(params);
    },
  });
}