import { useQuery, useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import {
  TOnboardingUser,
  TOnboardingAdminList,
  TSetupStepEvent,
  TOnboardingAdminActions,
} from './types';
import apiClient, { type TApiError } from '../apiClient';

export type TOnboardingAdminParams = {
  showIncompleteOnly?: boolean;
  q?: string;
  limit?: number;
  page?: number;
};

type TOnboardingActionBody = {
  step: string;
  action: TOnboardingAdminActions;
};

type TGetOnboardingAdminListResponse = {
  response: TOnboardingAdminList;
  status: number;
};

type TGetOnboardingUserResponse = {
  response: TOnboardingUser;
  status: number;
};

type TSendOnboardingActionResponse = {
  response: TSetupStepEvent;
  status: number;
};

async function getOnboardingAdminList(params: TOnboardingAdminParams) {
  const res = await apiClient.get<TGetOnboardingAdminListResponse>(
    `api/onboarding/admin/`,
    {
      params,
    }
  );
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
  const res = await apiClient.post<TSendOnboardingActionResponse>(
    `api/onboarding/user/${username}/`,
    body
  );
  return res.data.response;
}

const getOnboardingAdminListQuery = (queryParams: TOnboardingAdminParams) => ({
  queryKey: ['onboarding', 'adminList', queryParams],
  queryFn: () => getOnboardingAdminList(queryParams),
});
export function useGetOnboardingAdminList() {
  const [searchParams] = useSearchParams();
  const q = searchParams.get('q') || undefined;
  const showIncompleteOnly = searchParams.get('showIncompleteOnly') || 'false';
  const limit = searchParams.get('limit') || '20';
  const page = searchParams.get('page') || '1';
  return useQuery(
    getOnboardingAdminListQuery({
      q,
      showIncompleteOnly: showIncompleteOnly === 'true',
      limit: +limit,
      page: +page,
    })
  );
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
