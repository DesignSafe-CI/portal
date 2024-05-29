import { useMutation } from '@tanstack/react-query';
import apiClient from '../apiClient';

export type TPushKeysBody = {
  systemId: string;
  hostname: string;
  password: string;
  token: string;
};

async function pushKeys(body: TPushKeysBody) {
  const res = await apiClient.post(`/api/systems/keys/`, body);
  return res.data.response;
}

export function usePushKeys() {
  return useMutation({
    mutationFn: (body: TPushKeysBody) => {
      return pushKeys(body);
    },
  });
}

export default usePushKeys;
