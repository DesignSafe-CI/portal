import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { TUserUsage, TUserTicket } from './types';
import apiClient from '../apiClient';

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

const getUserUsageQuery = () => ({
  queryKey: ['users', 'usage'],
  queryFn: () => getUserUsage(),
});
const getUserTicketsQuery = () => ({
    queryKey: ['users', 'tickets'],
    queryFn: () => getUserTickets(),
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