import { useQueryClient, useQuery } from '@tanstack/react-query';
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

async function getNotifications(queryParams: TGetNotificationsParams) {
  const { event_type, ...params } = queryParams;
  const res = await apiClient.get<TGetNotificationsResponse>(
    event_type
      ? `/api/notifications/notifications/${event_type}/`
      : `/api/notifications/`,
    {
      params,
    }
  );
  return res.data.response;
}

export const getNotificationsQuery = (
  queryParams: TGetNotificationsParams
) => ({
  queryKey: ['workspace', 'getNotifications', queryParams],
  queryFn: () => getNotifications(queryParams),
  staleTime: 1000, // 1 second stale time
});

function useGetNotifications(queryParams: TGetNotificationsParams) {
  return useQuery(getNotificationsQuery(queryParams));
}

export const usePrefetchGetNotifications = (
  queryParams: TGetNotificationsParams
) => {
  const queryClient = useQueryClient();
  queryClient.ensureQueryData(getNotificationsQuery(queryParams));
};

export default useGetNotifications;
