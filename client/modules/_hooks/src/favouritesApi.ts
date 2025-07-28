import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from './apiClient';

export interface FavoriteTool {
  tool_id: string;
  version?: string;
}

const fetchFavorites = async ({
  signal,
}: {
  signal: AbortSignal;
}): Promise<FavoriteTool[]> => {
  const res = await apiClient.get('/api/workspace/user-favorites/', { signal });
  return res.data;
};

const addFavorite = async (toolId: string): Promise<void> => {
  await apiClient.post('/api/workspace/user-favorites/', { tool_id: toolId });
};

const removeFavorite = async (toolId: string): Promise<void> => {
  await apiClient.post('/api/workspace/user-favorites/remove/', {
    tool_id: toolId,
  });
};

export const useFavorites = () => {
  return useQuery({
    queryKey: ['workspace', 'favorites'],
    queryFn: fetchFavorites,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
};

export const useAddFavorite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addFavorite,
    onMutate: async (toolId) => {
      await queryClient.cancelQueries({ queryKey: ['workspace', 'favorites'] });

      const previousFavorites = queryClient.getQueryData<FavoriteTool[]>([
        'workspace',
        'favorites',
      ]);

      queryClient.setQueryData<FavoriteTool[]>(
        ['workspace', 'favorites'],
        (old = []) => [...old, { tool_id: toolId }]
      );

      return { previousFavorites };
    },
    onError: (_err, _toolId, context) => {
      if (context?.previousFavorites) {
        queryClient.setQueryData(
          ['workspace', 'favorites'],
          context.previousFavorites
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace', 'favorites'] });
    },
  });
};

export const useRemoveFavorite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removeFavorite,
    onMutate: async (toolId) => {
      await queryClient.cancelQueries({ queryKey: ['workspace', 'favorites'] });

      const previousFavorites = queryClient.getQueryData<FavoriteTool[]>([
        'workspace',
        'favorites',
      ]);

      queryClient.setQueryData<FavoriteTool[]>(
        ['workspace', 'favorites'],
        (old = []) => old.filter((fav) => fav.tool_id !== toolId)
      );

      return { previousFavorites };
    },
    onError: (_err, _toolId, context) => {
      if (context?.previousFavorites) {
        queryClient.setQueryData(
          ['workspace', 'favorites'],
          context.previousFavorites
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace', 'favorites'] });
    },
  });
};
