import { useQuery } from '@tanstack/react-query';
import apiClient from '../apiClient';
import * as turf from '@turf/turf';
import { Feature, Point, Polygon, MultiPolygon } from 'geojson';

export type OpenTopoFeature = {
  type: 'Feature';
  properties: {
    id: string;
    name: string;
    productAvailable: string;
    dateCreated: string;
    temporalCoverage: string;
    doiUrl: string;
    url: string;
    host: string;
    keywords: string;
    alternateName: string;
  };
  geometry: {
    type: 'Point' | 'Polygon' | 'MultiPolygon';
    coordinates: number[] | number[][][] | number[][][][];
  };
};

export type OpenTopoResponse = {
  Datasets: {
    Dataset: {
      name: string;
      identifier: {
        value: string;
      };
      alternateName: string;
      url: string;
      fileFormat: string;
      description: string;
      dateCreated: string;
      temporalCoverage: string;
      keywords: string;
      spatialCoverage: {
        geo: {
          geojson: {
            features: {
              geometry: {
                type: 'Polygon' | 'MultiPolygon';
                coordinates: number[][][] | number[][][][];
              };
            }[];
          };
        };
      };
    };
  }[];
};

export type ProcessedOpenTopoData = {
  original: {
    type: 'FeatureCollection';
    features: OpenTopoFeature[];
  };
  centroids: {
    type: 'FeatureCollection';
    features: OpenTopoFeature[];
  };
};

async function fetchOpenTopoData(): Promise<OpenTopoResponse> {
  const res = await apiClient.get<OpenTopoResponse>('/recon-portal/opentopo/');
  return res.data;
}

function preprocessData(data: OpenTopoResponse): ProcessedOpenTopoData {
  const seenUrls = new Map<string, OpenTopoFeature>();
  const result: ProcessedOpenTopoData['original'] = {
    type: 'FeatureCollection',
    features: [] as OpenTopoFeature[],
  };
  const centroidResult: ProcessedOpenTopoData['centroids'] = {
    type: 'FeatureCollection',
    features: [] as OpenTopoFeature[],
  };
  data.Datasets.forEach(({ Dataset: datasetInfo }) => {
    const {
      url,
      fileFormat,
      spatialCoverage,
      identifier,
      name,
      alternateName,
      dateCreated,
      temporalCoverage,
      keywords,
    } = datasetInfo;

    if (!url) return;

    if (seenUrls.has(url)) {
      const existingFeature = seenUrls.get(url);
      if (existingFeature && fileFormat) {
        existingFeature.properties.productAvailable += `, ${fileFormat}`;
      }
    } else {
      let geometry = {} as OpenTopoFeature['geometry'];
      if (spatialCoverage?.geo?.geojson?.features?.[0]?.geometry) {
        geometry = spatialCoverage.geo.geojson.features[0].geometry as OpenTopoFeature['geometry'];
      }

      const feature: OpenTopoFeature = {
        type: 'Feature',
        properties: {
          id: identifier.value,
          name,
          host: 'OpenTopo',
          url,
          doiUrl: url,
          alternateName,
          dateCreated,
          temporalCoverage,
          keywords,
          productAvailable: fileFormat,
        },
        geometry,
      };
      seenUrls.set(url, feature);
      result.features.push(feature);

      // Generate centroid
      if (geometry && (geometry.type === 'Polygon' || geometry.type === 'MultiPolygon')) {
        const geomShape = turf.centroid(feature as Feature);
        const centroidFeature: OpenTopoFeature = {
          type: 'Feature',
          properties: {
            id: identifier.value,
            name,
            host: 'OpenTopo',
            alternateName,
            doiUrl: url,
            dateCreated,
            keywords,
            temporalCoverage,
            url: `/datasetMetadata?otCollectionID=OT.${identifier.value.split('.').slice(1).join('.')}`,
            productAvailable: fileFormat,
          },
          geometry: {
            type: 'Point',
            coordinates: (geomShape.geometry as Point).coordinates,
          },
        };
        centroidResult.features.push(centroidFeature);
      }
    }
  });
  return { original: result, centroids: centroidResult };
}

export const getOpenTopoQuery = () => ({
  queryKey: ['opentopo'],
  queryFn: async () => {
    const data = await fetchOpenTopoData();
    return preprocessData(data);
  },
  staleTime: 1000 * 60 * 5, // 5 minute stale time
});

export function useGetOpenTopo() {
  return useQuery(getOpenTopoQuery());
}

export default useGetOpenTopo;
