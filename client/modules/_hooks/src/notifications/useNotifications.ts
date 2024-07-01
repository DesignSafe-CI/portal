import {
  useQueryClient,
  useQuery,
  useSuspenseQuery,
  useMutation,
} from '@tanstack/react-query';
import apiClient from '../apiClient';

type TPortalEventType = 'data_depot' | 'job' | 'interactive_session_ready';

export type TJobStatusNotification = {
  action_link: string;
  datetime: string;
  deleted: boolean;
  event_type: TPortalEventType;
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

export type TGetNotificationsResponse = {
  notifs: TJobStatusNotification[];
  page: number;
  total: number;
  unread: number;
};

type TGetNotificationsParams = {
  eventTypes?: TPortalEventType[];
  read?: boolean;
  limit?: number;
  skip?: number;
  markRead?: boolean;
};

async function getNotifications(params: TGetNotificationsParams) {
  const res = await apiClient.get<TGetNotificationsResponse>(
    '/api/notifications/',
    { params }
  );
  return res.data;
}

async function getUnreadNotifications(params: TGetNotificationsParams) {
  const res = await apiClient.get<{ unread: number }>(
    '/api/notifications/badge/',
    { params }
  );
  return res.data;
}

async function readNotifications(body: { eventTypes?: TPortalEventType[] }) {
  const res = await apiClient.patch('/api/notifications/', body);
  return res.data;
}

export function useReadNotifications() {
  return useMutation({
    mutationFn: (body: { eventTypes?: TPortalEventType[] }) => {
      return readNotifications(body);
    },
  });
}

const getNotificationsQuery = (params: TGetNotificationsParams) => ({
  queryKey: ['workspace', 'notifications', params],
  queryFn: () => getNotifications(params),
});

export function useGetNotifications(params: TGetNotificationsParams) {
  return useQuery(getNotificationsQuery(params));
}

export function useGetUnreadNotifications(params: TGetNotificationsParams) {
  return useQuery({
    queryKey: ['workspace', 'notifications', 'badge', params],
    queryFn: () => getUnreadNotifications(params),
  });
}

export const useGetNotificationsSuspense = (
  queryParams: TGetNotificationsParams
) => {
  return useSuspenseQuery(getNotificationsQuery(queryParams));
};

export const usePrefetchGetNotifications = (
  queryParams: TGetNotificationsParams
) => {
  const queryClient = useQueryClient();
  queryClient.ensureQueryData(getNotificationsQuery(queryParams));
};
