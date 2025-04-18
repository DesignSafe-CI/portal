import { useQuery } from '@tanstack/react-query';
import { FeatureCollection } from 'geojson';
import apiClient from '../apiClient';

export type OpenTopoDataset = {
  name: string;
  identifier: {
    '@type': string;
    propertyID: string;
    value: string;
  };
  alternateName: string;
  url: string;
  fileFormat: string;
  description: string;
  dateCreated: string;
  citation: string;
  temporalCoverage: string;
  keywords: string;
  spatialCoverage: {
    '@type': string;
    geo: {
      '@type': string;
      geojson: FeatureCollection;
    };
    additionalProperty: {
      '@type': string;
      additionalType: string;
      name: string;
      value: string;
    }[];
    variableMeasured: {
      '@type': string;
      name: string;
      value: string;
    }[];
  };
};

export type OpenTopoDatasetList = {
  Datasets: {
    Dataset: OpenTopoDataset;
  }[];
};

async function fetchOpenTopoData(): Promise<OpenTopoDatasetList> {
  const res = await apiClient.get<OpenTopoDatasetList>(
    '/recon-portal/opentopo/'
  );
  return res.data;
}

export const getOpenTopoQuery = () => ({
  queryKey: ['opentopo'],
  queryFn: fetchOpenTopoData,
  staleTime: 1000 * 60 * 5, // 5 minute stale time
});

export function useGetOpenTopo() {
  return useQuery<OpenTopoDatasetList>(getOpenTopoQuery());
}

export default useGetOpenTopo;
