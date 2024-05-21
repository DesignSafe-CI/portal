import {
  useQueryClient,
  useQuery,
  useSuspenseQuery,
} from '@tanstack/react-query';
import apiClient from '../apiClient';

type TPortalEventTypes = 'data_depot' | 'job' | 'interactive_session_ready';

export type TJobStatusNotification = {
  action_link: string;
  datetime: string;
  deleted: boolean;
  event_type: TPortalEventTypes;
  extra: {
    name: string;
    owner: string;
    remoteOutcome?: string;
    status: string;
    uuid: string;
  };
  message: string;
  operation: string;
  pk: number;
  read: boolean;
  status: string;
  user: string;
};

export type TNotificationsResponse = {
  notifs: TJobStatusNotification[];
  page: number;
  total: number;
  unread: number;
};

export type TGetNotificationsResponse = {
  response: TNotificationsResponse;
  status: number;
};

type TGetNotificationsParams = {
  event_type?: TPortalEventTypes;
  read?: boolean;
  limit?: number;
  skip?: number;
};

async function getNotifications(
  { signal }: { signal: AbortSignal },
  params: TGetNotificationsParams
) {
  const res = await apiClient.get<TGetNotificationsResponse>(
    `/api/notifications/notifications/jobs/`,
    {
      signal,
      params,
    }
  );
  return res.data.response;
}

const getNotificationsQuery = (queryParams: TGetNotificationsParams) => ({
  queryKey: ['workspace', 'getNotifications', queryParams],
  queryFn: ({ signal }: { signal: AbortSignal }) =>
    getNotifications({ signal }, queryParams),
  // staleTime: 5000,
});

export const useGetNotificationsSuspense = (
  queryParams: TGetNotificationsParams
) => {
  return useSuspenseQuery(getNotificationsQuery(queryParams));
};

const useGetNotifications = (queryParams: TGetNotificationsParams) => {
  return useQuery(getNotificationsQuery(queryParams));
};

export const usePrefetchGetNotifications = (
  queryParams: TGetNotificationsParams
) => {
  const queryClient = useQueryClient();
  queryClient.ensureQueryData(getNotificationsQuery(queryParams));
};

export default useGetNotifications;
