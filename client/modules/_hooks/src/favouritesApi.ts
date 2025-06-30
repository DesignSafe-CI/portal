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

export const getUserFavorites = fetchFavorites;
export const addFavorite = postAddFavorite;
export const removeFavorite = postRemoveFavorite;

export const useFavorites = () => {
  return useQuery<FavoriteTool[]>({
    queryKey: ['favorites'],
    queryFn: fetchFavorites,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useAddFavorite = () => {
  const queryClient = useQueryClient();
  return useMutation<void, unknown, string>({
    mutationFn: postAddFavorite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });
};

export const useRemoveFavorite = () => {
  const queryClient = useQueryClient();
  return useMutation<void, unknown, string>({
    mutationFn: postRemoveFavorite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });
};
