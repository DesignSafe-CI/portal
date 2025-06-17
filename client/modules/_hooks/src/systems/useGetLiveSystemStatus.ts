import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export type TaccSystemLive = {
  display_name: string;
  hostname: string;
  online: boolean;
  load: number;
  running: number;
  waiting: number;
  in_maintenance: boolean;
  next_maintenance: string;
};

type TaccStatusResponse = {
  [systemKey: string]: TaccSystemLive;
};

const fetchSystemStatus = async (): Promise<TaccSystemLive[]> => {
  // TODO: Replace with backend proxy (/api/system/live-status) for production
  const proxyUrl = 'https://corsproxy.io/?';
  const targetUrl = 'https://tap.tacc.utexas.edu/status/';
  const fullUrl = `${proxyUrl}${encodeURIComponent(targetUrl)}`;

  const res = await axios.get<TaccStatusResponse>(fullUrl);
  return Object.values(res.data);
};

export const useGetLiveSystemStatus = () => {
  return useQuery({
    queryKey: ['tacc', 'liveSystemStatus'],
    queryFn: fetchSystemStatus,
    staleTime: 60_000, // 60 seconds
  });
};
