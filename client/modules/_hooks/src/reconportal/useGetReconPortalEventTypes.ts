import { useQuery } from '@tanstack/react-query';
import apiClient from '../apiClient';

export type EventTypeResponse = {
  display_name: string;
  name: string;
};

async function getEventTypes() {
  const res = await apiClient.get<EventTypeResponse[]>(
    '/recon-portal/event-types'
  );
  return res.data;
}

export const getReconPortalEventTypesQuery = () => ({
  queryKey: ['reconportal', 'getEventTypes'],
  queryFn: getEventTypes,
  staleTime: 1000 * 60 * 5, // 5 minute stale time
});

export function useGetReconPortalEventTypes() {
  return useQuery<EventTypeResponse[]>(getReconPortalEventTypesQuery());
}

export default useGetReconPortalEventTypes;
