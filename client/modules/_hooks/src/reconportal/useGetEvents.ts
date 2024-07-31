// src/reconportal/useGetEvents.ts
import { useQuery } from '@tanstack/react-query';
import apiClient, { TApiError } from '../apiClient';

export type Dataset = {
  url: string;
  title: string;
  doi: string;
  id: string;
};

export type EventsResponse = {
  location_description: string;
  location: {
    lat: number;
    lon: number;
  };
  event_date: string;
  event_type: string;
  title: string;
  created_date: string;
  datasets: Dataset[];
};

async function getEvents() {
  const res = await apiClient.get<EventsResponse[]>('/recon-portal/events');
  return res.data;
}

export const getEventsQuery = () => ({
  queryKey: ['events'],
  queryFn: getEvents,
  staleTime: 1000 * 60 * 5, // 5 minute stale time
});

export function useGetEvents() {
  return useQuery(getEventsQuery());
}

export default useGetEvents;
