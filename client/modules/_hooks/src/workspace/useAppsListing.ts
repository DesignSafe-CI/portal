import { useQuery } from '@tanstack/react-query';
import apiClient from '../apiClient';

type AppMeta = {
  uuid: string;
  value: {
    definition: {
      id: string;
    };
  };
};

async function getAppsListing({ signal }: { signal: AbortSignal }) {
  const res = await apiClient.get<AppMeta[]>(
    `/applications/api/meta/?q=%7B"$and":%5B%7B"name":"ds_apps"%7D,%7B"value.definition.available":true%7D%5D%7D`,
    { signal }
  );
  return res.data;
}

function useAppsListing() {
  return useQuery({
    queryKey: ['workspace', 'appsListing'],
    queryFn: getAppsListing,
  });
}

export default useAppsListing;
