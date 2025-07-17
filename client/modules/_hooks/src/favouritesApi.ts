import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const getCSRFToken = (): string => {
  const match = document.cookie.match(/(^| )csrftoken=([^;]+)/);
  return match ? match[2] : '';
};

const axiosInstance = axios.create({
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface FavoriteTool {
  tool_id: string;
  version?: string;
}

const fetchFavorites = async (): Promise<FavoriteTool[]> => {
  const response = await axiosInstance.get('/api/workspace/user-favorites/');
  return response.data;
};

const postAddFavorite = async (toolId: string): Promise<void> => {
  const csrfToken = getCSRFToken();
  await axiosInstance.post(
    '/api/workspace/user-favorites/add/',
    { tool_id: toolId },
    { headers: { 'X-CSRFToken': csrfToken } }
  );
};

const postRemoveFavorite = async (toolId: string): Promise<void> => {
  const csrfToken = getCSRFToken();
  await axiosInstance.post(
    '/api/workspace/user-favorites/remove/',
    { tool_id: toolId },
    { headers: { 'X-CSRFToken': csrfToken } }
  );
};

export const useFavorites = () => {
  return useQuery<FavoriteTool[]>({
    queryKey: ['favorites'],
    queryFn: fetchFavorites,
    staleTime: 5 * 60 * 1000,
  });
};

export const useAddFavorite = () => {
  const queryClient = useQueryClient();

  return useMutation<
    void,
    unknown,
    string,
    { previousFavorites?: FavoriteTool[] }
  >({
    mutationFn: postAddFavorite,
    onMutate: async (toolId) => {
      await queryClient.cancelQueries({ queryKey: ['favorites'] });

      const previousFavorites = queryClient.getQueryData<FavoriteTool[]>([
        'favorites',
      ]);

      queryClient.setQueryData<FavoriteTool[]>(['favorites'], (old = []) => [
        ...old,
        { tool_id: toolId },
      ]);

      return { previousFavorites };
    },
    onError: (_err, _toolId, context) => {
      if (context?.previousFavorites) {
        queryClient.setQueryData(['favorites'], context.previousFavorites);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });
};

export const useRemoveFavorite = () => {
  const queryClient = useQueryClient();

  return useMutation<
    void,
    unknown,
    string,
    { previousFavorites?: FavoriteTool[] }
  >({
    mutationFn: postRemoveFavorite,
    onMutate: async (toolId) => {
      await queryClient.cancelQueries({ queryKey: ['favorites'] });

      const previousFavorites = queryClient.getQueryData<FavoriteTool[]>([
        'favorites',
      ]);

      queryClient.setQueryData<FavoriteTool[]>(['favorites'], (old = []) =>
        old.filter((fav) => fav.tool_id !== toolId)
      );

      return { previousFavorites };
    },
    onError: (_err, _toolId, context) => {
      if (context?.previousFavorites) {
        queryClient.setQueryData(['favorites'], context.previousFavorites);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });
};
