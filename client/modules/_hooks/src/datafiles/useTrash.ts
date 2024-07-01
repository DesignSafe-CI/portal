import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../apiClient';

type TTrashParam = { api: string; system: string; path: string };

function TrashFn(src: TTrashParam, dest: TTrashParam) {
  return apiClient.put(
    `/api/datafiles/${src.api}/private/trash/${src.system}/${src.path}/`,
    { trash_path: dest.path }
  );
}

export function useTrash() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ src, dest }: { src: TTrashParam; dest: TTrashParam }) =>
      TrashFn(src, dest),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['datafiles', 'fileListing'],
      });
      queryClient.resetQueries({ queryKey: ['selected-rows'] });
    },
  });
}
