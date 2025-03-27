/*
  Used in portal/client/src/workspace/SystemQueueTable.tsx 
  for getting system queue data from core portal
*/
export const useSystemQueue = async (hostname) => {
  const response = await fetch(`/api/proxy/status/${hostname}/`);

  if (!response.ok) {
    throw new Error(
      `API request failed: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();

  const queueData = Object.entries(data.queues).map(([queueName, details]) => ({
    name: queueName,
    ...details,
  }));

  return queueData;
};
