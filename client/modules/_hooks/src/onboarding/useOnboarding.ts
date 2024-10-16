import { useQuery, useMutation, useSuspenseQuery } from '@tanstack/react-query';
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

type TSetupStepEvent = {
  step: string;
  username: string;
  state: string;
  time: string;
  message: string;
  data?: Object;
};

type TOnboardingStep = {
  step: string;
  displayName: string;
  description: string;
  userConfirm: string;
  staffApprove: string;
  staffDeny: string;
  state?: string;
  events: TSetupStepEvent[];
  data?: string;
};

type TOnboardingUser = {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  isStaff: string;
  setupComplete: boolean;
  steps: TOnboardingStep[];
};

type TGetOnboardingUserResponse = {
  response: TOnboardingUser;
  status: number;
};

async function getOnboardingAdminList(params: TOnboardingAdminParams) {
  const res = await apiClient.get(`api/onboarding/admin/`, {
    params,
  });
  return res.data.response;
}

async function getOnboardingUser(username: string) {
  const res = await apiClient.get<TGetOnboardingUserResponse>(
    `api/onboarding/user/${username}`
  );
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

const getOnboardingUserQuery = (username: string) => ({
  queryKey: ['onboarding', 'user', username],
  queryFn: () => getOnboardingUser(username),
});
export function useGetOnboardingUser(username: string) {
  return useQuery(getOnboardingUserQuery(username));
}
export const useGetOnboardingUserSuspense = (username: string) => {
  return useSuspenseQuery(getOnboardingUserQuery(username));
};

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
