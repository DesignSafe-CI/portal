// client/src/api/favouritesApi.ts

import axios from 'axios';

export const getUserFavorites = async () => {
  const response = await axios.get('/api/datafiles/favorites/');
  return response.data;
};

export const addFavorite = async (toolId: string) => {
  const response = await axios.post('/api/datafiles/favorites/add/', { tool_id: toolId });
  return response.data;
};

export const removeFavorite = async (toolId: string) => {
  const response = await axios.post('/api/datafiles/favorites/remove/', { tool_id: toolId });
  return response.data;
};
