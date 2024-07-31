// src/reconportal/useGetEventTypes.ts
import { useSuspenseQuery, useQueryClient } from '@tanstack/react-query';
import apiClient, { TApiError } from '../apiClient';

export type EventTypeResponse = {
  display_name: string;
  name: string;
};

async function getEventTypes() {
  const res = await apiClient.get<EventTypeResponse[]>('/recon-portal/event-types');
  return res.data;
}

export const getEventTypesQuery = () => ({
  queryKey: ['reconportal', 'getEventTypes'],
  queryFn: getEventTypes,
  staleTime: 1000 * 60 * 5, // 5 minute stale time
});

export function useGetEventTypes() {
  return useSuspenseQuery(getEventTypesQuery());
}

export const usePrefetchGetEventTypes = () => {
  const queryClient = useQueryClient();
  queryClient.ensureQueryData(getEventTypesQuery());
};

export default useGetEventTypes;
