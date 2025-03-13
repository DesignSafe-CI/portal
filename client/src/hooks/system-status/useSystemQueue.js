/*
  Used in portal/client/src/workspace/SystemQueueTable.tsx 
  for getting system queue data from core portal
*/
export const useSystemQueue = async (hostname) => {
  const response = await fetch(`/api/proxy/system-monitor/${hostname}/`);

  if (!response.ok) {
    throw new Error(
      `API request failed: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();

  //Test Data - comment out "const data" above and replace with version below
  /*
    const data = [
      {
        "name": "development$$$",
        "down": true,
        "hidden": false,
        "load": 0.959390862944162,
        "free": 16,
        "running": 10,
        "waiting": 0
      },
      {
        "name": "flex",
        "down": true,
        "hidden": false,
        "load": 0.999636803874092,
        "free": 23,
        "running": 4,
        "waiting": 16
      },
      {
        "name": "EXlarge",
        "down": true,
        "hidden": true,
        "load": 0.99975024975025,
        "free": 2,
        "running": 4,
        "waiting": 8
      },
      {
        "name": "normal",
        "down": false,
        "hidden": false,
        "load": 0.99975024975025,
        "free": 2,
        "running": 50,
        "waiting": 823
      },
      {
        "name": "nvdimm",
        "down": false,
        "hidden": false,
        "load": 0.583333333333333,
        "free": 5,
        "running": 2,
        "waiting": 0
      },
      {
        "name": "rtx",
        "down": true,
        "hidden": false,
        "load": 0.488095238095238,
        "free": 43,
        "running": 17,
        "waiting": 0
      },
      {
        "name": "rtx-dev",
        "down": false,
        "hidden": false,
        "load": 0.166666666666667,
        "free": 5,
        "running": 1,
        "waiting": 0
      },
      {
        "name": "small",
        "down": true,
        "hidden": false,
        "load": 1,
        "free": 0,
        "running": 155,
        "waiting": 287
      }
    ]
    */

  return data;
};
