import { useQuery, useMutation } from '@tanstack/react-query';
import apiClient, { type TApiError } from '../apiClient';

type TOnboardingAdminParams = {
  showIncompleteOnly?: boolean;
  query_string?: string;
  limit?: number;
  offset?: number;
};

type TOnboardingActionBody = {
  step: string;
  action: string;
};

async function getOnboardingAdminList(params: TOnboardingAdminParams) {
  const res = await apiClient.get(`api/onboarding/admin/`, {
    params,
  });
  return res.data.response;
}

async function getOnboardingAdminUser(username: string) {
  const res = await apiClient.get(`api/onboarding/admin/${username}`);
  return res.data.response;
}

async function sendOnboardingAction(
  body: TOnboardingActionBody,
  username?: string
) {
  const res = await apiClient.post(`api/onboarding/user/${username}`, body);
  return res.data.response;
}

const getOnboardingAdminListQuery = (queryParams: TOnboardingAdminParams) => ({
  queryKey: ['onboarding', 'adminList', queryParams],
  queryFn: () => getOnboardingAdminList(queryParams),
});
export function useGetOnboardingAdminList(queryParams: TOnboardingAdminParams) {
  return useQuery(getOnboardingAdminListQuery(queryParams));
}

const getOnboardingAdminUserQuery = (username: string) => ({
  queryKey: ['onboarding', 'adminUser', username],
  queryFn: () => getOnboardingAdminUser(username),
});
export function useGetOnboardingAdminUser(username: string) {
  return useQuery(getOnboardingAdminUserQuery(username));
}

export function useSendOnboardingAction() {
  return useMutation({
    mutationFn: ({
      body,
      username,
    }: {
      body: TOnboardingActionBody;
      username: string;
    }) => {
      return sendOnboardingAction(body, username);
    },
    onError: (err: TApiError) => err,
  });
}
