import { useState, useEffect } from 'react';

interface HPCSystem {
  display_name: string;
  hostname: string;
  load_percentage: number;
  is_operational: boolean;
  in_maintenance: boolean;
  jobs: {
    running: number;
    queued: number;
  };
}

export function useSystemOverview() {
  const [systems, setSystems] = useState<HPCSystem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSystems() {
      try 
      {
        setLoading(true);
        const response = await fetch('/api/proxy/system-monitor/');
        if (!response.ok) 
        {
          throw new Error(`Request failed: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        setSystems(data);
        setError(null);
      } 
      catch (err) 
      {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } 
      finally 
      {
        setLoading(false);
      }
    }
    fetchSystems();
  }, []);

  return { systems, loading, error };
}