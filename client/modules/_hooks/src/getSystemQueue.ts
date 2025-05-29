interface QueueDetails {
  down: boolean;
  hidden: boolean;
  load: number;
  free: number;
  running: number;
  waiting: number;
}

interface SystemQueueResponse {
  queues: {
    [queueName: string]: QueueDetails;
  };
}

export interface QueueItem extends QueueDetails {
  name: string;
}

export const getSystemQueue = async (
  hostname: string
): Promise<QueueItem[]> => {
  const response = await fetch(`/api/proxy/status/${hostname}/`);

  if (!response.ok) {
    throw new Error(
      `API request failed: ${response.status} ${response.statusText}`
    );
  }

  const data: SystemQueueResponse = await response.json();

  const queueData: QueueItem[] = Object.entries(data.queues).map(
    ([queueName, details]) => ({
      name: queueName,
      ...details,
    })
  );

  return queueData;
};
