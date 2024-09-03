import { useMutation } from '@tanstack/react-query';
import apiClient, { type TApiError } from '../apiClient';

export type TPushKeysBody = {
  systemId: string;
  hostname: string;
  password: string;
  token: string;
};

type TPushKeysOperation = 'push_keys' | 'check_and_send_sms_challenge';

async function pushKeys(operation: TPushKeysOperation, body?: TPushKeysBody) {
  const res = await apiClient.post(`/api/systems/keys/${operation}/`, body);
  return res.data.response;
}

export function usePushKeys(operation: TPushKeysOperation) {
  return useMutation({
    mutationFn: (body?: TPushKeysBody) => {
      return pushKeys(operation, body);
    },
    onError: (err: TApiError) => err,
  });
}

export default usePushKeys;
