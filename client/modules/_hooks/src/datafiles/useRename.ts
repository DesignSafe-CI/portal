import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../apiClient';

type TRenameParam = {
  api: string;
  system: string;
  path: string;
  name: string;
  newName: string;
};

function renameFn(src: TRenameParam) {
  return apiClient.put(
    `/api/datafiles/${src.api}/private/rename/${src.system}/${src.path}/${src.name}/`,
    { new_name: src.newName }
  );
}

export function useRename() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ src }: { src: TRenameParam }) => renameFn(src),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['datafiles', 'fileListing'],
      });
      queryClient.resetQueries({ queryKey: ['selected-rows'] });
    },
  });
}
