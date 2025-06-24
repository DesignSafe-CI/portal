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

export const getUserFavorites = async (): Promise<FavoriteTool[]> => {
  try {
    const response = await axiosInstance.get('/api/datafiles/favorites/');
    return response.data;
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return [];
  }
};

export const addFavorite = async (toolId: string): Promise<boolean> => {
  try {
    const csrfToken = getCSRFToken();
    await axiosInstance.post(
      '/api/datafiles/favorites/add/',
      { tool_id: toolId },
      {
        headers: {
          'X-CSRFToken': csrfToken,
        },
      }
    );
    return true;
  } catch (error) {
    console.error(`Error adding favorite (${toolId}):`, error);
    return false;
  }
};

export const removeFavorite = async (toolId: string): Promise<boolean> => {
  try {
    const csrfToken = getCSRFToken();
    await axiosInstance.post(
      '/api/datafiles/favorites/remove/',
      { tool_id: toolId },
      {
        headers: {
          'X-CSRFToken': csrfToken,
        },
      }
    );
    return true;
  } catch (error) {
    console.error(`Error removing favorite (${toolId}):`, error);
    return false;
  }
};
