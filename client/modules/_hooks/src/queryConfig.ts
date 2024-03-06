import { UseQueryOptions } from '@tanstack/react-query';
import { TApiError } from './apiClient';

// Convenience type for passing spread params to useQuery
export type TQueryOptionExtras<TResponse, TError = TApiError> = Omit<
  UseQueryOptions<TResponse, TError>,
  'queryKey' | 'queryFn'
>;
