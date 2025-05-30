import { useQuery } from '@tanstack/react-query';

interface HPCSystem {
  display_name: string;
  hostname: string;
  load_percentage: number;
  is_operational: boolean;
  in_maintenance: boolean;
  reachable: boolean;
  queues_down: boolean;
  running: number;
  waiting: number;
}

async function fetchSystems(): Promise<HPCSystem[]> {
  const response = await fetch(`/api/proxy/status/`);
  if (!response.ok) {
    throw new Error(
      `Request failed: ${response.status} ${response.statusText}`
    );
  }
  const raw = await response.json();

  const data = raw.response;

  return Object.keys(data)
    .filter((key) => data[key].system_type === 'COMPUTE')
    .map((key) => {
      const system = data[key];
      return {
        display_name: system.display_name,
        hostname: system.hostname,
        load_percentage: Math.round(system.load * 100),
        is_operational:
          system.online &&
          system.reachable &&
          !(system.queues_down || system.in_maintenance),
        in_maintenance: system.in_maintenance,
        reachable: system.reachable,
        queues_down: system.queues_down,
        running: system.running,
        waiting: system.waiting,
      };
    });
}

export function useSystemOverview() {
  return useQuery<HPCSystem[], Error>({
    queryKey: ['systemOverview'],
    queryFn: fetchSystems,
  });
}
