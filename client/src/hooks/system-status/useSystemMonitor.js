/*
  Used in portal/client/src/workspace/SystemQueueTable.tsx 
  for getting system status data from core portal
*/
export const useSystemQueue = async (hostname) => {
    const response = await fetch(`/api/proxy/system-monitor/${hostname}/`);
  
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
  
    const data = await response.json();
    return data;
  };