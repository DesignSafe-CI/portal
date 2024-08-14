import { useQuery } from '@tanstack/react-query';
import apiClient from '../../apiClient';

export type TNeesDetailsItem = {
  agavePath: string;
  children: Record<string, unknown>[];
  deleted: boolean;
  format: string;
  length: number;
  name: string;
  path: string;
  permissions: string;
  system: string;
  systemID: string;
  type: string;
  metadata: {
    experiments: TNeesExperimentMetadata[];
    project: TNeesProjectMetadata;
  };
};

export type TNeesExperimentMetadata = {
  creators: {
    lastName: string;
    firstName: string;
  }[];
  doi: string;
  startDate: string;
  endDate: string;
  description: string;
  title: string;
  deleted: boolean;
  material: {
    materials: string[];
    component: string;
  }[];
  facility: {
    country: string;
    state: string;
    name: string;
  }[];
  equipment: {
    equipment: string;
    component: string;
    equipmentClass: string;
    facility: string;
  }[];
  path: string;
  sensors: string[];
  type: string;
  specimenType: {
    name: string;
  }[];
  name: string;
};

export type TNeesProjectMetadata = {
  description: string;
  endDate: string;
  startDate: string;
  facility: {
    country: string;
    state: string;
    name: string;
  }[];
  name: string;
  organization: {
    country: string;
    state: string;
    name: string;
  }[];
  pis: {
    firstName: string;
    lastName: string;
  }[];
  project: string;
  publications: {
    authors: string[];
    title: string;
  }[];
  system: string;
  title: string;
  sponsor: {
    url: string;
    name: string;
  }[];
  systemId: string;
};

async function getNeesDetails({
  neesId,
  signal,
}: {
  neesId: string;
  signal: AbortSignal;
}) {
  const resp = await apiClient.get<TNeesDetailsItem>(
    `/api/projects/nees-publication/${neesId}/`,
    {
      signal,
    }
  );
  return resp.data;
}

export function useNeesDetails(neesId: string) {
  return useQuery({
    queryKey: ['datafiles', 'nees', 'details', neesId],
    queryFn: ({ signal }) => getNeesDetails({ neesId, signal }),
    enabled: !!neesId,
  });
}
