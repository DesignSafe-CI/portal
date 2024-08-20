import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../apiClient';

type TMoveParam = { api: string; system: string; path: string };

function MoveFn(src: TMoveParam, dest: TMoveParam, doi?: string) {
  return apiClient.put(
    `/api/datafiles/${src.api}/private/move/${src.system}/${src.path}/${
      doi ? `?doi=${doi}` : ''
    }`,
    { dest_system: dest.system, dest_path: dest.path }
  );
}

export function useFileMove() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      src,
      dest,
      doi,
    }: {
      src: TMoveParam;
      dest: TMoveParam;
      doi?: string;
    }) => MoveFn(src, dest, doi),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['datafiles', 'fileListing'],
      });
      queryClient.resetQueries({ queryKey: ['selected-rows'] });
    },
  });
}
