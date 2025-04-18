import { useQuery, UseQueryResult } from '@tanstack/react-query';
import apiClient from '../apiClient';

export type ReconPortalDataset = {
  url: string;
  title: string;
  doi: string;
  id: string;
};

export type ReconPortalEvents = {
  location_description: string;
  location: {
    lat: number;
    lon: number;
  };
  event_date: string;
  event_type: string;
  title: string;
  created_date: string;
  datasets: ReconPortalDataset[];
};

async function getEvents() {
  const res = await apiClient.get<ReconPortalEvents[]>('/recon-portal/events');
  return res.data;
}

export const getEventsQuery = () => ({
  queryKey: ['events'],
  queryFn: getEvents,
  staleTime: 1000 * 60 * 5, // 5 minute stale time
});

export function useGetReconPortalEvents(): UseQueryResult<ReconPortalEvents[]> {
  return useQuery<ReconPortalEvents[]>(getEventsQuery());
}

export default useGetReconPortalEvents;
