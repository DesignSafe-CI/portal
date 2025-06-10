import { OpenTopoDataset } from '@client/hooks';
import { FeatureCollection } from 'geojson';

// TODO docstr and move to better spot and add types
// and add return type to make clear the order
export function getFirstCoordinate(geojson: FeatureCollection) {
  const firstFeature = geojson.features[0];
  const coords = firstFeature.geometry?.coordinates || firstFeature.coordinates;

  function findFirstCoord(arr) {
    if (typeof arr[0] === 'number' && typeof arr[1] === 'number') {
      return arr;
    }
    return findFirstCoord(arr[0]);
  }

  return findFirstCoord(coords);
}