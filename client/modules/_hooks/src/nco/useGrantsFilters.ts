import { useQuery } from '@tanstack/react-query';
import apiClient from '../apiClient';

//facility list
export type TNcoGrantsFacilityList = {
  response: string[];
};
async function getNcoGrantsFacilityListing({
  signal,
}: {
  signal: AbortSignal;
}) {
  const resp = await apiClient.get<TNcoGrantsFacilityList>(
    `/nco/api/ttc_facilities`,
    {
      signal,
    }
  );
  return resp.data;
}
export function useNcoGrantsFacilityListing() {
  return useQuery({
    queryKey: ['nco', 'grants', 'facilitylist'],
    queryFn: ({ signal }) => getNcoGrantsFacilityListing({ signal }),
  });
}

//grant type list
export type TNcoGrantsGrantTypeList = {
  response: string[];
};
async function getNcoGrantsGrantTypeListing({
  signal,
}: {
  signal: AbortSignal;
}) {
  const resp = await apiClient.get<TNcoGrantsGrantTypeList>(
    `/nco/api/ttc_grant_types`,
    {
      signal,
    }
  );
  return resp.data;
}
export function useNcoGrantsGrantTypeListing() {
  return useQuery({
    queryKey: ['nco', 'grants', 'granttype'],
    queryFn: ({ signal }) => getNcoGrantsGrantTypeListing({ signal }),
  });
}

//hazard type list
export type TNcoGrantsHazardTypeList = {
  response: string[];
};
async function getNcoGrantsHazardTypeListing({
  signal,
}: {
  signal: AbortSignal;
}) {
  const resp = await apiClient.get<TNcoGrantsHazardTypeList>(
    `/nco/api/ttc_hazard_types`,
    {
      signal,
    }
  );
  return resp.data;
}
export function useNcoGrantsHazardTypeListing() {
  return useQuery({
    queryKey: ['nco', 'grants', 'hazardtype'],
    queryFn: ({ signal }) => getNcoGrantsHazardTypeListing({ signal }),
  });
}
