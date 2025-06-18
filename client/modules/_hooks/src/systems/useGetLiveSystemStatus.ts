import { useState, useEffect } from 'react';
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
  const proxyUrl = 'https://corsproxy.io/?';
  const targetUrl = 'https://tap.tacc.utexas.edu/status/';
  const fullUrl = `${proxyUrl}${encodeURIComponent(targetUrl)}`;

  const res = await axios.get<TaccStatusResponse>(fullUrl);
  return Object.values(res.data);
};

// ✅ Replaces useQuery with useEffect + useState
export const useGetLiveSystemStatus = () => {
  const [data, setData] = useState<TaccSystemLive[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await fetchSystemStatus();
        setData(result);
      } catch (err) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Optional: auto-refresh every 60 seconds
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  return { data, isLoading, error };
};
