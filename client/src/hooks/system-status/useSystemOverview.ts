//used in portal/client/src/workspace/SystemQueueTable.tsx
//for getting system overview data (load%, running jobs, waiting jobs)
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

      //Test Data - comment out "const data" above and replace with version below
        /*
        const data = [
          {
            "display_name": "Lonestar6",
            "hostname": "ls6.tacc.utexas.edu",
            "resource_type": "COMPUTE",
            "load_percentage": 95,
            "jobs": {
              "running": 436,
              "queued": 311
            },
            "online": true,
            "reachable": true,
            "queues_down": false,
            "in_maintenance": true,
            "is_operational": false
          },
          {
            "display_name": "Frontera",
            "hostname": "frontera.tacc.utexas.edu",
            "resource_type": "COMPUTE",
            "load_percentage": 98,
            "jobs": {
              "running": 250,
              "queued": 1132
            },
            "online": true,
            "reachable": true,
            "queues_down": false,
            "in_maintenance": true,
            "is_operational": false
          },
          {
            "display_name": "Stampede3",
            "hostname": "stampede3.tacc.utexas.edu",
            "resource_type": "COMPUTE",
            "load_percentage": 90,
            "jobs": {
              "running": 458,
              "queued": 49
            },
            "online": true,
            "reachable": true,
            "queues_down": false,
            "in_maintenance": false,
            "is_operational": true
          }
        ]
        */

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