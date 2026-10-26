import { useQuery, useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { TUserUsage, TUserTicket, TUserNotification } from './types';
import apiClient, { type TApiError } from '../apiClient';

export type TUserNotificationsResponse = {
    notifs: TUserNotification[] | undefined;
    page: number;
    total: number;
    unread: number;
}

async function getUserUsage() {
  const res = await apiClient.get<TUserUsage>(
        `api/users/usage/`
  );
  return res.data;
}

async function getUserTickets() {
    const res = await apiClient.get<TUserTicket[]>(
        `help/tickets?fmt=json`
    );
    return res.data;
}

async function getUserNotifications() {
    const res = await apiClient.get<TUserNotificationsResponse>(
        `api/notifications/`
    );
    return res.data;
}

const getUserUsageQuery = () => ({
  queryKey: ['users', 'usage'],
  queryFn: () => getUserUsage(),
});
const getUserTicketsQuery = () => ({
    queryKey: ['users', 'tickets'],
    queryFn: () => getUserTickets(),
});
const getUserNotificationsQuery = () => ({
    queryKey: ['users', 'notifications'],
    queryFn: () => getUserNotifications(),
});

export function useGetUserUsage() {
  return useQuery(getUserUsageQuery());
}
export const useGetUserUsageSuspense = () => {
  return useSuspenseQuery(getUserUsageQuery());
};
export function useGetUserTickets() {
  return useQuery(getUserTicketsQuery());
}
export const useGetUserTicketsSuspense = () => {
  return useSuspenseQuery(getUserTicketsQuery());
};
export function useGetUserNotifications() {
    return useQuery(getUserNotificationsQuery());
}