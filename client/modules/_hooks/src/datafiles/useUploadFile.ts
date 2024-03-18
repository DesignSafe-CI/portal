import { useMutation } from '@tanstack/react-query';
import apiClient from '../apiClient';
import type { UploadFile } from 'antd';


type TUploadFileParam = {
  api: string;
  system: string;
  scheme?: string;
  path: string;
  uploaded_file: UploadFile[];
};

function uploadFileFn(src: TUploadFileParam) {
  return apiClient.post(
    `/api/datafiles/${src.api}/${src.scheme}/upload/${src.system}/${encodeURIComponent(src.path)}/`,
    { uploaded_file: src.uploaded_file }
  );
}

export function useUploadFile() {
  return useMutation({
    mutationFn: ({ src }: { src: TUploadFileParam }) => {
      console.log('src object:', src);
      console.log('uploaded_file:', src.uploaded_file);
      return uploadFileFn(src);
    },
  });
}
